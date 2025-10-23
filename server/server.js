const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Para tokens de sesión
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const port = 5000;
const JWT_SECRET = "tu_clave_secreta_super_segura_cambiala"; // CAMBIAR EN PRODUCCIÓN

// Configuración de la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "art_gallery",
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to art_gallery database");
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper: Obtener siguiente ID usando el procedimiento almacenado
const getNextId = (tableName) => {
  return new Promise((resolve, reject) => {
    db.query("CALL next_id(?, @next_id)", [tableName], (err) => {
      if (err) return reject(err);
      db.query("SELECT @next_id as next_id", (err, results) => {
        if (err) return reject(err);
        resolve(results[0].next_id);
      });
    });
  });
};

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido o expirado" });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTENTICACIÓN
// ============================================

// Registro de usuario
app.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, role = "visitor" } = req.body;
    
    // Validaciones básicas
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const id = await getNextId("users");
    const password_hash = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)";
    const values = [id, full_name, email, password_hash, role];

    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "El email ya está registrado" });
        }
        return res.status(500).json({ message: "Error al crear usuario: " + err.message });
      }
      
      return res.status(201).json({ 
        success: "Usuario creado exitosamente", 
        id: id,
        email: email,
        role: role
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error del servidor" });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }
      
      const user = results[0];
      
      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }

      // Verificar si el usuario está activo
      if (user.status !== 'active') {
        return res.status(403).json({ message: "Usuario inactivo" });
      }
      
      // Generar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // No enviar el password_hash al cliente
      delete user.password_hash;
      
      return res.json({
        success: true,
        message: "Login exitoso",
        token: token,
        user: user
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// Verificar token (para mantener sesión)
app.get("/verify-token", authenticateToken, (req, res) => {
  const sql = "SELECT id, full_name, email, role, status, created_at FROM users WHERE id = ?";
  db.query(sql, [req.user.id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json({ valid: true, user: results[0] });
  });
});

// Cambiar contraseña
app.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Se requieren ambas contraseñas" });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    // Verificar contraseña actual
    const sql = "SELECT password_hash FROM users WHERE id = ?";
    db.query(sql, [req.user.id], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const validPassword = await bcrypt.compare(current_password, results[0].password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ message: "Contraseña actual incorrecta" });
      }

      // Hash de la nueva contraseña
      const new_hash = await bcrypt.hash(new_password, 10);
      
      const updateSql = "UPDATE users SET password_hash = ? WHERE id = ?";
      db.query(updateSql, [new_hash, req.user.id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error al actualizar contraseña" });
        }
        return res.json({ success: "Contraseña actualizada exitosamente" });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// ============================================
// ENDPOINTS PARA USUARIOS
// ============================================

// Obtener perfil del usuario autenticado
app.get("/me", authenticateToken, (req, res) => {
  const sql = "SELECT id, full_name, email, role, status, created_at FROM users WHERE id = ?";
  db.query(sql, [req.user.id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json(results[0]);
  });
});

// Actualizar perfil del usuario autenticado
app.put("/me", authenticateToken, (req, res) => {
  const { full_name, email } = req.body;
  
  const sql = "UPDATE users SET full_name = ?, email = ? WHERE id = ?";
  const values = [full_name, email, req.user.id];

  db.query(sql, values, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "El email ya está en uso" });
      }
      return res.status(500).json({ message: "Error al actualizar: " + err.message });
    }
    return res.json({ success: "Perfil actualizado exitosamente" });
  });
});

// Obtener todos los usuarios (solo admin)
app.get("/users", (req, res) => {
  const sql = "SELECT id, full_name, email, role, status, created_at FROM users";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    return res.json(result);
  });
});

// Obtener un usuario por ID
app.get("/users/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT id, full_name, email, role, status, created_at FROM users WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (result.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json(result[0]);
  });
});

// Actualizar usuario (admin)
app.put("/users/:id", (req, res) => {
  const id = req.params.id;
  const { full_name, email, role, status } = req.body;
  
  const sql = "UPDATE users SET full_name = ?, email = ?, role = ?, status = ? WHERE id = ?";
  const values = [full_name, email, role, status, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "El email ya está en uso" });
      }
      return res.status(500).json({ message: "Error al actualizar: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json({ success: "Usuario actualizado exitosamente" });
  });
});

// Eliminar usuario
app.delete("/users/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error al eliminar: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json({ success: "Usuario eliminado exitosamente" });
  });
});

// ============================================
// ENDPOINTS PARA ARTISTAS
// ============================================

// Crear perfil de artista
app.post("/artists", async (req, res) => {
  try {
    const { id, stage_name, bio, country, city, birth_year, website, instagram } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Se requiere el ID del usuario" });
    }

    const sql = `INSERT INTO artists (id, stage_name, bio, country, city, birth_year, website, instagram) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [id, stage_name, bio, country, city, birth_year, website, instagram];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error al crear perfil de artista: " + err.message });
      }
      return res.status(201).json({ success: "Perfil de artista creado exitosamente" });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// Obtener perfil de artista del usuario autenticado
app.get("/me/artist", authenticateToken, (req, res) => {
  const sql = `
    SELECT a.*, u.full_name, u.email, u.status 
    FROM artists a 
    JOIN users u ON a.id = u.id 
    WHERE a.id = ?
  `;
  db.query(sql, [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (result.length === 0) {
      return res.status(404).json({ message: "Perfil de artista no encontrado" });
    }
    return res.json(result[0]);
  });
});

// Actualizar perfil de artista del usuario autenticado
app.put("/me/artist", authenticateToken, (req, res) => {
  const { stage_name, bio, country, city, birth_year, death_year, website, instagram } = req.body;
  
  const sql = `UPDATE artists SET stage_name = ?, bio = ?, country = ?, city = ?, 
               birth_year = ?, death_year = ?, website = ?, instagram = ? 
               WHERE id = ?`;
  const values = [stage_name, bio, country, city, birth_year, death_year, website, instagram, req.user.id];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error al actualizar: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Perfil de artista no encontrado" });
    }
    return res.json({ success: "Perfil de artista actualizado exitosamente" });
  });
});

// Obtener todos los artistas con información del usuario
app.get("/artists", (req, res) => {
  const sql = `
    SELECT a.*, u.full_name, u.email, u.status 
    FROM artists a 
    JOIN users u ON a.id = u.id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    return res.json(result);
  });
});

// Obtener un artista por ID
app.get("/artists/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT a.*, u.full_name, u.email, u.status 
    FROM artists a 
    JOIN users u ON a.id = u.id 
    WHERE a.id = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (result.length === 0) {
      return res.status(404).json({ message: "Artista no encontrado" });
    }
    return res.json(result[0]);
  });
});

// Actualizar perfil de artista (admin o el mismo artista)
app.put("/artists/:id", (req, res) => {
  const id = req.params.id;
  const { stage_name, bio, country, city, birth_year, death_year, website, instagram, verified } = req.body;
  
  const sql = `UPDATE artists SET stage_name = ?, bio = ?, country = ?, city = ?, 
               birth_year = ?, death_year = ?, website = ?, instagram = ?, verified = ? 
               WHERE id = ?`;
  const values = [stage_name, bio, country, city, birth_year, death_year, website, instagram, verified, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error al actualizar: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Artista no encontrado" });
    }
    return res.json({ success: "Perfil de artista actualizado exitosamente" });
  });
});

// ============================================
// ENDPOINTS PARA OBRAS DE ARTE
// ============================================

// Crear obra de arte (solo artistas)
app.post("/artworks", authenticateToken, async (req, res) => {
  try {
    const {
      title, description, year, category_name, medium_name,
      width_cm, height_cm, depth_cm, framed, is_for_sale, price_cents,
      currency, status
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "El título es requerido" });
    }

    // Verificar que el usuario sea artista
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Solo los artistas pueden crear obras" });
    }

    const id = await getNextId("artworks");

    const sql = `INSERT INTO artworks (id, artist_id, title, description, year, category_name, 
                 medium_name, width_cm, height_cm, depth_cm, framed, is_for_sale, price_cents, 
                 currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      id, req.user.id, title, description, year, category_name, medium_name,
      width_cm, height_cm, depth_cm, framed || 0, is_for_sale || 1,
      price_cents, currency || 'USD', status || 'draft'
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error al crear obra: " + err.message });
      }
      return res.status(201).json({ 
        success: "Obra creada exitosamente", 
        id: id 
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// Obtener obras del artista autenticado
app.get("/me/artworks", authenticateToken, (req, res) => {
  const sql = "SELECT * FROM artworks WHERE artist_id = ? ORDER BY created_at DESC";
  
  db.query(sql, [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    return res.json(result);
  });
});

// Obtener todas las obras con información del artista
app.get("/artworks", (req, res) => {
  const sql = `
    SELECT aw.*, a.stage_name, u.full_name as artist_name
    FROM artworks aw
    JOIN artists a ON aw.artist_id = a.id
    JOIN users u ON a.id = u.id
    ORDER BY aw.created_at DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    return res.json(result);
  });
});

// Obtener obra por ID
app.get("/artworks/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT aw.*, a.stage_name, u.full_name as artist_name
    FROM artworks aw
    JOIN artists a ON aw.artist_id = a.id
    JOIN users u ON a.id = u.id
    WHERE aw.id = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (result.length === 0) {
      return res.status(404).json({ message: "Obra no encontrada" });
    }
    return res.json(result[0]);
  });
});

// Obtener obras por artista
app.get("/artists/:id/artworks", (req, res) => {
  const artistId = req.params.id;
  const sql = "SELECT * FROM artworks WHERE artist_id = ? ORDER BY created_at DESC";
  
  db.query(sql, [artistId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    return res.json(result);
  });
});

// Actualizar obra (solo el artista dueño o admin)
app.put("/artworks/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const {
    title, description, year, category_name, medium_name,
    width_cm, height_cm, depth_cm, framed, is_for_sale,
    price_cents, currency, status
  } = req.body;

  // Verificar que la obra pertenezca al artista
  const checkSql = "SELECT artist_id FROM artworks WHERE id = ?";
  db.query(checkSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (results.length === 0) {
      return res.status(404).json({ message: "Obra no encontrada" });
    }
    
    if (results[0].artist_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "No tienes permiso para editar esta obra" });
    }

    const sql = `UPDATE artworks SET title = ?, description = ?, year = ?, 
                 category_name = ?, medium_name = ?, width_cm = ?, height_cm = ?, 
                 depth_cm = ?, framed = ?, is_for_sale = ?, price_cents = ?, 
                 currency = ?, status = ? WHERE id = ?`;
    const values = [
      title, description, year, category_name, medium_name,
      width_cm, height_cm, depth_cm, framed, is_for_sale,
      price_cents, currency, status, id
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error al actualizar: " + err.message });
      }
      return res.json({ success: "Obra actualizada exitosamente" });
    });
  });
});

// Eliminar obra (solo el artista dueño o admin)
app.delete("/artworks/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  
  // Verificar que la obra pertenezca al artista
  const checkSql = "SELECT artist_id FROM artworks WHERE id = ?";
  db.query(checkSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    if (results.length === 0) {
      return res.status(404).json({ message: "Obra no encontrada" });
    }
    
    if (results[0].artist_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta obra" });
    }

    const sql = "DELETE FROM artworks WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error al eliminar: " + err.message });
      }
      return res.json({ success: "Obra eliminada exitosamente" });
    });
  });
});

// ============================================
// ENDPOINTS PARA FAVORITOS
// ============================================

// Agregar a favoritos
app.post("/favorites", authenticateToken, async (req, res) => {
  try {
    const { artwork_id } = req.body;

    if (!artwork_id) {
      return res.status(400).json({ message: "Se requiere artwork_id" });
    }

    const id = await getNextId("favorites");

    const sql = "INSERT INTO favorites (id, user_id, artwork_id) VALUES (?, ?, ?)";
    const values = [id, req.user.id, artwork_id];

    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Esta obra ya está en favoritos" });
        }
        return res.status(500).json({ message: "Error al agregar favorito: " + err.message });
      }
      return res.status(201).json({ 
        success: "Agregado a favoritos", 
        id: id 
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// Obtener favoritos del usuario autenticado
app.get("/me/favorites", authenticateToken, (req, res) => {
  const sql = `
    SELECT f.*, aw.title, aw.price_cents, aw.currency, aw.status,
           a.stage_name, u.full_name as artist_name
    FROM favorites f
    JOIN artworks aw ON f.artwork_id = aw.id
    JOIN artists a ON aw.artist_id = a.id
    JOIN users u ON a.id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;
  
  db.query(sql, [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    return res.json(result);
  });
});

// Verificar si una obra está en favoritos
app.get("/favorites/check/:artwork_id", authenticateToken, (req, res) => {
  const artwork_id = req.params.artwork_id;
  const sql = "SELECT id FROM favorites WHERE user_id = ? AND artwork_id = ?";
  
  db.query(sql, [req.user.id, artwork_id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error del servidor" });
    return res.json({ isFavorite: result.length > 0 });
  });
});

// Eliminar de favoritos
app.delete("/favorites/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM favorites WHERE id = ? AND user_id = ?";
  
  db.query(sql, [id, req.user.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error al eliminar: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Favorito no encontrado" });
    }
    return res.json({ success: "Eliminado de favoritos" });
  });
});

// Eliminar de favoritos por artwork_id
app.delete("/favorites/artwork/:artwork_id", authenticateToken, (req, res) => {
  const artwork_id = req.params.artwork_id;
  const sql = "DELETE FROM favorites WHERE artwork_id = ? AND user_id = ?";
  
  db.query(sql, [artwork_id, req.user.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error al eliminar: " + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Favorito no encontrado" });
    }
    return res.json({ success: "Eliminado de favoritos" });
  });
});

// ============================================
// ENDPOINTS PARA SOLICITUDES DE COMPRA
// ============================================

// Crear solicitud de compra
app.post("/purchase-requests", async (req, res) => {
  try {
    const {
      artwork_id, buyer_user_id, buyer_name, buyer_email,
      buyer_phone, message, offer_price_cents, currency
    } = req.body;

    if (!artwork_id) {
      return res.status(400).json({ message: "Se requiere artwork_id" });
    }

    const id = await getNextId("purchase_requests");

    const sql = `INSERT INTO purchase_requests (id, artwork_id, buyer_user_id, buyer_name, 
                 buyer_email, buyer_phone, message, offer_price_cents, currency) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      id, artwork_id, buyer_user_id, buyer_name, buyer_email,
      buyer_phone, message, offer_price_cents, currency || 'USD'
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error al crear solicitud: " + err.message });
      }
      return res.status(201).json({ 
        success: "Solicitud de compra creada exitosamente", 
        id: id 
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno: " + error.message });
  }
});

// Obtener solicitudes de compra del usuario autenticado (como comprador)
app.get("/me/purchase-requests", authenticateToken, (req, res) => {
  const sql = `
    SELECT pr.*, aw.title as artwork_title, aw.price_cents as artwork
