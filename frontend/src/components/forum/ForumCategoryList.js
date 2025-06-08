// src/components/forum/ForumCategoryList.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // <- uvozimo Link umjesto <a>

const ForumCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState(null);

  const [topicsMap, setTopicsMap] = useState({});
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [errorTopics, setErrorTopics] = useState(null);

  const API_BASE = "http://localhost:8000/forum";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) {
          throw new Error("Greška pri dohvatu kategorija");
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setErrorCategories(err.message);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      setTopicsMap({});
      return;
    }

    const fetchAllTopics = async () => {
      try {
        setLoadingTopics(true);
        const allPromises = categories.map(async (cat) => {
          try {
            const resp = await fetch(
              `${API_BASE}/categories/${cat.category_id}/topics`
            );
            if (!resp.ok) {
              throw new Error(
                `Greška pri dohvatu tema za kategoriju ${cat.category_id}`
              );
            }
            const topics = await resp.json();
            return { categoryId: cat.category_id, topics };
          } catch {
            return { categoryId: cat.category_id, topics: [] };
          }
        });

        const results = await Promise.all(allPromises);
        const map = {};
        results.forEach((r) => {
          map[r.categoryId] = r.topics;
        });
        setTopicsMap(map);
      } catch (err) {
        setErrorTopics(err.message);
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchAllTopics();
  }, [categories]);

  if (loadingCategories) return <p>Učitavanje kategorija...</p>;
  if (errorCategories) return <p className="text-red-600">Greška: {errorCategories}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kategorije foruma</h2>

      {categories.length === 0 ? (
        <p>Nema dostupnih kategorija.</p>
      ) : (
        <ul className="space-y-8">
          {categories.map((category) => (
            <li
              key={category.category_id}
              className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold text-blue-600">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}

              {loadingTopics ? (
                <p className="italic text-gray-500">Učitavanje tema…</p>
              ) : errorTopics ? (
                <p className="text-red-500">Greška pri učitavanju tema.</p>
              ) : (
                <>
                  {topicsMap[category.category_id] &&
                    topicsMap[category.category_id].length > 0 ? (
                    <div className="flex flex-col space-y-3">
                      {topicsMap[category.category_id].map((topic) => {
                        const date = new Date(topic.created_at).toLocaleDateString("hr-HR");
                        return (
                          <Link
                            key={topic.topic_id}
                            to={`/app/reader/forums/topics/${topic.topic_id}`}
                            className="w-full border rounded-xl p-4 flex justify-between items-center hover:shadow-lg transition hover:bg-gray-50"
                          >
                            <span className="font-medium text-gray-800">
                              {topic.title}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(topic.created_at).toLocaleDateString("hr-HR")}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="italic text-gray-500">
                      Nema tema u ovoj kategoriji.
                    </p>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ForumCategoryList;
