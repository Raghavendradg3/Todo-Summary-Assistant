import express from "express"
import { pool } from "../config/db.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = ?", [req.user.id])

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(users[0])
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update user profile
router.patch("/me", authenticateToken, async (req, res) => {
  const { username, email } = req.body

  if (!username && !email) {
    return res.status(400).json({ message: "No fields to update" })
  }

  try {
    // Check if username or email already exists
    if (username || email) {
      const query = []
      const values = []

      if (username) {
        query.push("username = ?")
        values.push(username)
      }

      if (email) {
        query.push("email = ?")
        values.push(email)
      }

      const [existingUsers] = await pool.query(`SELECT * FROM users WHERE (${query.join(" OR ")}) AND id != ?`, [
        ...values,
        req.user.id,
      ])

      if (existingUsers.length > 0) {
        return res.status(409).json({ message: "Username or email already exists" })
      }
    }

    // Update user
    const updates = {}
    if (username) updates.username = username
    if (email) updates.email = email

    const setClause = Object.entries(updates)
      .map(([key, _]) => `${key} = ?`)
      .join(", ")
    const values = [...Object.values(updates), req.user.id]

    await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, values)

    // Get updated user
    const [updatedUsers] = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = ?", [
      req.user.id,
    ])

    res.json(updatedUsers[0])
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
