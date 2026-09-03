import db from '../db.js';

export const getLanguages = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM languages ORDER BY language_name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
};

export const createLanguage = async (req, res) => {
  try {
    const { language_code, language_name } = req.body;

    if (!language_code || !language_name) {
      return res.status(400).json({ error: 'Language code and name are required' });
    }

    await db.promise().query(
      'INSERT INTO languages (language_code, language_name) VALUES (?, ?)',
      [language_code, language_name]
    );

    res.status(201).json({ message: 'Language added successfully' });
  } catch (error) {
    console.error('Error adding language:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Language code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add language' });
    }
  }
};

export const updateLanguagePreference = async (req, res) => {
  try {
    const { userId } = req.params;
    const { language_code } = req.body;

    if (!language_code) {
      return res.status(400).json({ error: 'Language code is required' });
    }

    const [langRows] = await db.promise().query('SELECT language_code FROM languages WHERE language_code = ?', [language_code]);
    if (langRows.length === 0) {
      return res.status(404).json({ error: 'Language not supported' });
    }

    await db.promise().query(
      'UPDATE users SET preferred_language = ? WHERE user_id = ?',
      [language_code, userId]
    );

    res.json({ message: 'Language preference updated successfully' });
  } catch (error) {
    console.error('Error updating language preference:', error);
    res.status(500).json({ error: 'Failed to update language preference' });
  }
};

export const getLanguagePreference = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.promise().query(
      `SELECT u.preferred_language, l.language_name
       FROM users u
       LEFT JOIN languages l ON u.preferred_language = l.language_code
       WHERE u.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      language_code: rows[0].preferred_language || 'en',
      language_name: rows[0].language_name || 'English'
    });
  } catch (error) {
    console.error('Error fetching user language preference:', error);
    res.status(500).json({ error: 'Failed to fetch language preference' });
  }
};
