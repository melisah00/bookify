import React, { useState, useEffect } from 'react';

export default function ForumCategoryCreate() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/forum/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setError('Greška pri dohvaćanju kategorija.'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/forum/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Nepoznata greška.');
      }

      const newCategory = await res.json();
      setCategories(prev => [...prev, newCategory]);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Forum Kategorije</h2>

      {error && <div className="text-red-500 mb-2">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Naziv</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border rounded p-2"
            placeholder="Unesite naziv kategorije"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Opis (opcionalno)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Unesite opis kategorije"
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Kreiranje...' : 'Kreiraj kategoriju'}
        </button>
      </form>

      <ul className="space-y-2">
        {categories.map(cat => (
          <li key={cat.category_id} className="border p-3 rounded">
            <h3 className="font-semibold">{cat.name}</h3>
            {cat.description && <p className="text-sm text-gray-600">{cat.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
