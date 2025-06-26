import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ForumCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState(null);
  const { user, loading: authLoading } = useAuth();

  const [topicsMap, setTopicsMap] = useState({});
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [errorTopics, setErrorTopics] = useState(null);

  const [isBlocked, setIsBlocked] = useState(false);
  const [checkedBlocked, setCheckedBlocked] = useState(false);

  const API_BASE = "http://localhost:8000/forum";

  const basePath = user?.roles?.includes("admin")
    ? "/app/admin"
    : user?.roles?.includes("author")
      ? "/app/author"
      : "/app/reader";

  useEffect(() => {
    const checkBlockedStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/users/me/blocked", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsBlocked(data.is_blocked);
        }
      } catch (err) {
        console.error("Error checking block status:", err);
      } finally {
        setCheckedBlocked(true);
      }
    };

    if (!authLoading) {
      checkBlockedStatus();
    }
  }, [authLoading]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) {
          throw new Error("Error fetching categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setErrorCategories(err.message);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (checkedBlocked && !isBlocked) {
      fetchCategories();
    }
  }, [checkedBlocked, isBlocked]);

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
                `Error fetching topics for category ${cat.category_id}`
              );
            }
            const topics = await resp.json();

            const sortedTopics = topics.sort((a, b) => {
              if (a.is_pinned && !b.is_pinned) return -1;
              if (!a.is_pinned && b.is_pinned) return 1;
              return 0;
            });

            return { categoryId: cat.category_id, topics: sortedTopics };
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

    if (!isBlocked) {
      fetchAllTopics();
    }
  }, [categories, isBlocked]);


  if (!checkedBlocked || authLoading) return <p>Loading...</p>;

  if (isBlocked) {
    return (
      <div className="p-6 text-center text-red-700 text-lg font-semibold">
        Due to violations of forum rules, you are blocked until further notice.
      </div>
    );
  }

  if (errorCategories) {
    return <p className="text-red-600">Error: {errorCategories}</p>;
  }

  return (
    <div className="p-4">
      <h2
        className="font-bold mb-4"
        style={{ color: 'rgb(102,178,160)', fontSize: '2.5rem' }}
      >
        Forum
      </h2>


      {categories.length === 0 ? (
        <p>No categories available.</p>
      ) : (
        <ul className="space-y-8">
          {categories.map((category) => (
            <li
              key={category.category_id}
              className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-xl font-semibold text-green-800">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}

              {loadingTopics ? (
                <p className="italic text-gray-500">Loading topics…</p>
              ) : errorTopics ? (
                <p className="text-red-500">Error loading topics.</p>
              ) : (
                <>
                  {topicsMap[category.category_id] &&
                    topicsMap[category.category_id].length > 0 ? (
                    <div className="flex flex-col space-y-3">
                      {topicsMap[category.category_id].map((topic) => {
                        const date = new Date(
                          topic.created_at
                        ).toLocaleDateString("en-GB");
                        return (
                          <Link
                            key={topic.topic_id}
                            to={`${basePath}/forums/topics/${topic.topic_id}`}
                            className={`w-full border rounded-xl p-4 flex justify-between items-center hover:shadow-lg transition hover:bg-gray-50 ${topic.is_locked
                              ? "opacity-70 cursor-not-allowed"
                              : ""
                              }`}
                          >
                            <span className="font-medium text-gray-800 flex items-center gap-2">
                              {topic.is_pinned && (
                                <span className="text-yellow-600 font-bold">
                                  📌
                                </span>
                              )}
                              {topic.is_locked && (
                                <span className="text-red-600">🔒</span>
                              )}
                              {topic.title}
                            </span>
                            <span className="text-sm text-gray-500">{date}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="italic text-gray-500">
                      No topics in this category.
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
