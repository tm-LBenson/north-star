const express = require("express");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const NOTES_COLLECTION = "notes";

router.use(requireAuth);

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function getOwnedNote(noteId, userId) {
  const noteRef = db.collection(NOTES_COLLECTION).doc(noteId);
  const noteSnapshot = await noteRef.get();

  if (!noteSnapshot.exists) {
    return null;
  }

  const note = {
    id: noteSnapshot.id,
    ...noteSnapshot.data(),
  };

  if (note.userId !== userId) {
    return null;
  }

  return {
    ref: noteRef,
    note,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const snapshot = await db.collection(NOTES_COLLECTION).where("userId", "==", req.user.id).get();

    const notes = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.status(200).json(notes);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = cleanText(req.body?.title);
    const body = cleanText(req.body?.body);

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    const now = new Date().toISOString();
    const payload = {
      userId: req.user.id,
      title,
      body,
      createdAt: now,
      updatedAt: now,
    };

    const noteRef = await db.collection(NOTES_COLLECTION).add(payload);

    return res.status(201).json({
      id: noteRef.id,
      ...payload,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const ownedNote = await getOwnedNote(req.params.id, req.user.id);

    if (!ownedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.status(200).json(ownedNote.note);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const title = cleanText(req.body?.title);
    const body = cleanText(req.body?.body);

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    const ownedNote = await getOwnedNote(req.params.id, req.user.id);

    if (!ownedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    const updatedAt = new Date().toISOString();

    await ownedNote.ref.update({
      title,
      body,
      updatedAt,
    });

    return res.status(200).json({
      ...ownedNote.note,
      title,
      body,
      updatedAt,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const ownedNote = await getOwnedNote(req.params.id, req.user.id);

    if (!ownedNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    await ownedNote.ref.delete();

    return res.status(200).json({ message: "Note deleted" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
