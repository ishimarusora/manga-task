import { useEffect, useState } from "react";

function App() {
  const [episodes, setEpisodes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mangaTaskV2"));
    if (saved) setEpisodes(saved);
  }, []);

  const save = (data) => {
    setEpisodes(data);
    localStorage.setItem("mangaTaskV2", JSON.stringify(data));
  };

  const current = episodes[currentIndex];

  const addEpisode = () => {
    if (!newTitle) return;

    const newEp = {
      id: Date.now(),
      title: newTitle,
      pages: [],
      startDate: "",
      deadline: "",
    };

    const updated = [...episodes, newEp];
    save(updated);
    setNewTitle("");
    setCurrentIndex(updated.length - 1);
  };

  const deleteEpisode = () => {
    if (!current) return;

    if (!window.confirm("この話を削除しますか？")) return;

    const updated = episodes.filter((_, i) => i !== currentIndex);
    save(updated);

    setCurrentIndex(updated.length === 0 ? 0 : Math.max(0, currentIndex - 1));
  };

  const generatePages = () => {
    if (!current || !pageCount) return;

    const count = Number(pageCount);
    if (!count || count <= 0) return;

    const arr = Array.from({ length: count }, (_, i) => ({
      page: i + 1,
      weight: 0,
      date: "",
      done: false,
    }));

    const updated = [...episodes];
    updated[currentIndex].pages = arr;
    save(updated);
  };

  const updatePage = (index, key, value) => {
    const updated = [...episodes];
    updated[currentIndex].pages[index][key] = value;
    save(updated);
  };

  const updateMeta = (key, value) => {
    const updated = [...episodes];
    updated[currentIndex][key] = value;
    save(updated);
  };

  const today = new Date().toISOString().split("T")[0];

  const visiblePages = showTodayOnly
    ? current?.pages.filter((p) => p.date === today)
    : current?.pages || [];

  const grouped =
    visiblePages.reduce((acc, p) => {
      if (!p.date) return acc;
      if (!acc[p.date]) acc[p.date] = [];
      acc[p.date].push(p);
      return acc;
    }, {}) || {};

  const doneCount = current?.pages.filter((p) => p.done).length || 0;
  const totalCount = current?.pages.length || 0;
  const progress = totalCount
    ? Math.round((doneCount / totalCount) * 100)
    : 0;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">漫画管理</h1>

      <select
        className="border p-2 w-full mb-2"
        value={currentIndex}
        onChange={(e) => {
          setCurrentIndex(Number(e.target.value));
          setPageCount("");
        }}
      >
        {episodes.map((ep, i) => (
          <option key={ep.id} value={i}>
            {ep.title}
          </option>
        ))}
      </select>

      <div className="flex gap-2 mb-2">
        <input
          className="border p-2 flex-1"
          placeholder="新しい話"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button
          onClick={addEpisode}
          className="bg-blue-500 text-white px-3 rounded"
        >
          追加
        </button>
      </div>

      {current && (
        <button
          onClick={deleteEpisode}
          className="bg-red-500 text-white w-full p-2 mb-4 rounded"
        >
          この話を削除
        </button>
      )}

      {current && (
        <>
          {/* 表示切替 */}
          <button
            onClick={() => setShowTodayOnly(!showTodayOnly)}
            className="bg-gray-200 w-full p-2 mb-3 rounded"
          >
            {showTodayOnly ? "全部表示" : "今日だけ表示"}
          </button>

          <input
            type="number"
            placeholder="ページ数"
            className="border p-2 w-full mb-2"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
          />

          <button
            className="bg-blue-500 text-white p-2 w-full mb-4 rounded"
            onClick={generatePages}
          >
            ページ生成
          </button>

          <input
            type="date"
            className="border p-2 w-full mb-2"
            value={current.startDate}
            onChange={(e) => updateMeta("startDate", e.target.value)}
          />

          <input
            type="date"
            className="border p-2 w-full mb-4"
            value={current.deadline}
            onChange={(e) => updateMeta("deadline", e.target.value)}
          />

          {visiblePages.map((p, i) => (
            <div key={i} className="mb-3 border p-2 rounded space-y-2">
              <div className="flex justify-between">
                <span className={p.done ? "line-through text-gray-400" : ""}>
                  p{p.page}
                </span>

                <div className="flex gap-2">
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      onClick={() =>
                        updatePage(
                          current.pages.findIndex(
                            (x) => x.page === p.page
                          ),
                          "weight",
                          w
                        )
                      }
                      className={`px-2 border rounded ${
                        p.weight === w ? "bg-green-400" : ""
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="date"
                className="border p-2 w-full"
                value={p.date}
                onChange={(e) =>
                  updatePage(
                    current.pages.findIndex(
                      (x) => x.page === p.page
                    ),
                    "date",
                    e.target.value
                  )
                }
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={p.done}
                  onChange={() =>
                    updatePage(
                      current.pages.findIndex(
                        (x) => x.page === p.page
                      ),
                      "done",
                      !p.done
                    )
                  }
                />
                完了
              </label>
            </div>
          ))}

          <h2 className="font-bold mt-4">日別スケジュール</h2>

          {Object.entries(grouped)
            .sort()
            .map(([date, list]) => (
              <div
                key={date}
                className={`border p-2 mt-2 rounded ${
                  date === today ? "bg-yellow-100" : ""
                }`}
              >
                <p className="font-bold">
                  {date} {date === today && "← 今日"}
                </p>

                <div className="flex gap-2 flex-wrap mt-2">
                  {list.map((p) => (
                    <span
                      key={p.page}
                      className={`px-2 py-1 border rounded text-sm ${
                        p.done
                          ? "bg-gray-300 line-through"
                          : "bg-blue-100"
                      }`}
                    >
                      p{p.page}
                    </span>
                  ))}
                </div>
              </div>
            ))}

          <div className="mt-4">
            <p>進捗: {progress}%</p>
            <div className="w-full bg-gray-200 h-3 rounded">
              <div
                className="bg-green-500 h-3 rounded"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;