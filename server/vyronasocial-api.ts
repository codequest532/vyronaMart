// Complete VyronaSocial API - Isolated Implementation
import express from 'express';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

export function setupVyronaSocialAPI(app: express.Application) {
  // Create Shopping Room
  app.post("/api/vyronasocial/rooms", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const { name, description, addMembers = [] } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Room name is required" });
      }

      // Generate unique room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Insert room into database
      const result = await pool.query(`
        INSERT INTO shopping_groups (name, description, creator_id, is_active, max_members, room_code, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [name, description || '', 1, true, 10, roomCode]);
      
      const dbRoom = result.rows[0];
      
      // Add creator as admin
      await pool.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [dbRoom.id, 1, 'admin']);
      
      let memberCount = 1; // Start with creator
      
      // Add selected members to the group
      if (addMembers && addMembers.length > 0) {
        for (const userIdentifier of addMembers) {
          try {
            // Find user by username or email
            const userResult = await pool.query(`
              SELECT id FROM users WHERE username = $1 OR email = $1 LIMIT 1
            `, [userIdentifier]);
            
            if (userResult.rows.length > 0) {
              const userId = userResult.rows[0].id;
              
              // Check if user is not already a member (avoid duplicates)
              const existingMember = await pool.query(`
                SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2
              `, [dbRoom.id, userId]);
              
              if (existingMember.rows.length === 0) {
                await pool.query(`
                  INSERT INTO group_members (group_id, user_id, role, joined_at)
                  VALUES ($1, $2, $3, NOW())
                `, [dbRoom.id, userId, 'member']);
                memberCount++;
              }
            }
          } catch (memberError) {
            console.warn(`Failed to add member ${userIdentifier}:`, memberError);
            // Continue with other members even if one fails
          }
        }
      }
      
      const room = {
        id: dbRoom.id,
        name: dbRoom.name,
        description: dbRoom.description,
        category: "general",
        privacy: "public",
        creatorId: dbRoom.creator_id,
        isActive: dbRoom.is_active,
        memberCount: memberCount,
        totalCart: 0,
        currentGame: null,
        roomCode: dbRoom.room_code,
        scheduledTime: null,
        maxMembers: dbRoom.max_members,
        createdAt: dbRoom.created_at
      };
      
      res.json(room);
    } catch (error) {
      console.error("VyronaSocial room creation error:", error);
      res.status(500).json({ error: "Failed to create room" });
    } finally {
      await pool.end();
    }
  });

  // Get All Rooms
  app.get("/api/vyronasocial/rooms", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const result = await pool.query(`
        SELECT sg.*, 
               COUNT(DISTINCT gm.id) as member_count,
               COALESCE(SUM(ci.quantity * p.price), 0) as total_cart
        FROM shopping_groups sg
        LEFT JOIN group_members gm ON sg.id = gm.group_id
        LEFT JOIN cart_items ci ON sg.id = ci.room_id
        LEFT JOIN products p ON ci.product_id = p.id
        WHERE sg.is_active = true
        GROUP BY sg.id
        ORDER BY sg.created_at DESC
      `);
      
      const rooms = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: "general",
        privacy: "public",
        creatorId: row.creator_id,
        isActive: row.is_active,
        memberCount: parseInt(row.member_count) || 0,
        totalCart: row.total_cart || 0,
        currentGame: null,
        roomCode: row.room_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
        scheduledTime: null,
        maxMembers: row.max_members,
        createdAt: row.created_at
      }));
      
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(rooms);
    } catch (error) {
      console.error("Get VyronaSocial rooms error:", error);
      res.status(500).json({ error: "Failed to get rooms" });
    } finally {
      await pool.end();
    }
  });

  // Join Room
  app.post("/api/vyronasocial/rooms/join", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const { roomCode } = req.body;
      
      if (!roomCode) {
        return res.status(400).json({ error: "Room code is required" });
      }

      // Find room by code
      const roomResult = await pool.query(`
        SELECT * FROM shopping_groups WHERE room_code = $1 AND is_active = true
      `, [roomCode]);
      
      if (roomResult.rows.length === 0) {
        return res.status(404).json({ error: "Room not found" });
      }
      
      const room = roomResult.rows[0];
      
      // Check if user already in room
      const memberCheck = await pool.query(`
        SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [room.id, 1]);
      
      if (memberCheck.rows.length > 0) {
        return res.status(400).json({ error: "Already in room" });
      }
      
      // Add member
      await pool.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [room.id, 1, 'member']);
      
      res.json({ message: "Joined room successfully", roomId: room.id });
    } catch (error) {
      console.error("Join room error:", error);
      res.status(500).json({ error: "Failed to join room" });
    } finally {
      await pool.end();
    }
  });

  // Delete Room (Admin Only)
  app.delete("/api/vyronasocial/rooms/:id", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      const userId = 1; // From session when auth is implemented
      
      // Check if user is the creator/admin of the room
      const roomResult = await pool.query(`
        SELECT * FROM shopping_groups WHERE id = $1 AND creator_id = $2
      `, [roomId, userId]);
      
      if (roomResult.rows.length === 0) {
        return res.status(403).json({ error: "Only room admin can delete the room" });
      }
      
      // First delete cart items associated with this room
      await pool.query(`
        DELETE FROM cart_items WHERE room_id = $1
      `, [roomId]);
      
      // Delete group members
      await pool.query(`
        DELETE FROM group_members WHERE group_id = $1
      `, [roomId]);
      
      // Delete the room
      await pool.query(`
        DELETE FROM shopping_groups WHERE id = $1
      `, [roomId]);
      
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Delete room error:", error);
      res.status(500).json({ error: "Failed to delete room" });
    } finally {
      await pool.end();
    }
  });

  // Exit Room
  app.post("/api/vyronasocial/rooms/:id/exit", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      const userId = 1; // From session when auth is implemented
      
      // Check if user is in the room
      const memberResult = await pool.query(`
        SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (memberResult.rows.length === 0) {
        return res.status(400).json({ error: "You are not a member of this room" });
      }
      
      // Remove user from room
      await pool.query(`
        DELETE FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      res.json({ message: "Exited room successfully" });
    } catch (error) {
      console.error("Exit room error:", error);
      res.status(500).json({ error: "Failed to exit room" });
    } finally {
      await pool.end();
    }
  });

  // Add Member to Room (Admin Only)
  app.post("/api/vyronasocial/rooms/:id/members", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      const { userIdentifier } = req.body; // username or email
      const adminUserId = 1; // From session when auth is implemented
      
      // Check if requesting user is an admin
      const adminCheck = await pool.query(`
        SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, adminUserId]);
      
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: "Only admins can add members" });
      }
      
      // Find user by username or email
      const userResult = await pool.query(`
        SELECT id FROM users WHERE username = $1 OR email = $1 LIMIT 1
      `, [userIdentifier]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userId = userResult.rows[0].id;
      
      // Check if user is already a member
      const existingMember = await pool.query(`
        SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, userId]);
      
      if (existingMember.rows.length > 0) {
        return res.status(400).json({ error: "User is already a member" });
      }
      
      // Add user as member
      await pool.query(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [roomId, userId, 'member']);
      
      res.json({ message: "Member added successfully" });
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({ error: "Failed to add member" });
    } finally {
      await pool.end();
    }
  });

  // Remove Member from Room (Admin Only)
  app.delete("/api/vyronasocial/rooms/:id/members/:userId", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      const targetUserId = parseInt(req.params.userId);
      const adminUserId = 1; // From session when auth is implemented
      
      // Check if requesting user is an admin
      const adminCheck = await pool.query(`
        SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, adminUserId]);
      
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: "Only admins can remove members" });
      }
      
      // Check if target user is a member
      const memberCheck = await pool.query(`
        SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, targetUserId]);
      
      if (memberCheck.rows.length === 0) {
        return res.status(404).json({ error: "User is not a member of this room" });
      }
      
      // Remove member
      await pool.query(`
        DELETE FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, targetUserId]);
      
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({ error: "Failed to remove member" });
    } finally {
      await pool.end();
    }
  });

  // Promote Member to Admin (Admin Only)
  app.post("/api/vyronasocial/rooms/:id/members/:userId/promote", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      const targetUserId = parseInt(req.params.userId);
      const adminUserId = 1; // From session when auth is implemented
      
      // Check if requesting user is an admin
      const adminCheck = await pool.query(`
        SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, adminUserId]);
      
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).json({ error: "Only admins can promote members" });
      }
      
      // Check if target user is a member
      const memberCheck = await pool.query(`
        SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2
      `, [roomId, targetUserId]);
      
      if (memberCheck.rows.length === 0) {
        return res.status(404).json({ error: "User is not a member of this room" });
      }
      
      if (memberCheck.rows[0].role === 'admin') {
        return res.status(400).json({ error: "User is already an admin" });
      }
      
      // Promote to admin
      await pool.query(`
        UPDATE group_members SET role = 'admin' WHERE group_id = $1 AND user_id = $2
      `, [roomId, targetUserId]);
      
      res.json({ message: "Member promoted to admin successfully" });
    } catch (error) {
      console.error("Promote member error:", error);
      res.status(500).json({ error: "Failed to promote member" });
    } finally {
      await pool.end();
    }
  });

  // Get Room Members
  app.get("/api/vyronasocial/rooms/:id/members", async (req, res) => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      const roomId = parseInt(req.params.id);
      
      // Get all members with user info
      const result = await pool.query(`
        SELECT gm.*, u.username, u.email, u.id as user_id
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
        ORDER BY gm.role DESC, gm.joined_at ASC
      `, [roomId]);
      
      const members = result.rows.map(row => ({
        id: row.user_id,
        username: row.username,
        email: row.email,
        role: row.role,
        joinedAt: row.joined_at
      }));
      
      res.json(members);
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ error: "Failed to get members" });
    } finally {
      await pool.end();
    }
  });
}