import { useEffect, useState } from "react";

function App() {
  const [episodes, setEpisodes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mangaTaskV3"));
    if (saved) {
      setEpisodes(saved);
    }
  }, []);

  const save = (data) => {
    setEpisodes(data);
    localStorage.setItem("mangaTaskV3", JSON.stringify(data));
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

    const confirmDelete = window.confirm("この話を削除しますか？");
    if (!confirmDelete) return;

    const updated = episodes.filter((_, i) => i !== currentIndex);
    save(updated);

    if (updated.length === 0) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const generatePages = () => {
    if (!current || !pageCount) return;

    const count = Number(pageCount);
    if (!count || count <= 0) return;

    const arr = Array.from({ length: count }, (_, i) => ({
      page: i + 1,
      weight: 0,
      date: "",
      progress: {
        name: false,
        draft: false,
        pen: false,
        finish: false,
        tone: false,
      },
    }));

    const updated = [...episodes];
    updated[currentIndex].pages = arr;
    save(updated);
  };

  const updateMeta = (key, value) => {
    const updated = [...episodes];
    updated[currentIndex][key] = value;
    save(updated);
  };

  const updatePage = (index, key, value) => {
    const updated = [...episodes];
    updated[currentIndex].pages[index][key] = value;
    save(updated);
  };

  const updateProgress = (index, progressKey) => {
    const updated = [...episodes];
    const currentValue =
      updated[currentIndex].pages[index].progress[progressKey];

    updated[currentIndex].pages[index].progress[progressKey] = !currentValue;
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

  const isPageComplete = (page) => {
    return Object.values(page.progress).every(Boolean);
  };

  const doneCount =
    current?.pages.filter((p) => isPageComplete(p)).length || 0;

  const totalCount = current?.pages.length || 0;

  const progressPercent = totalCount
    ? Math.round((doneCount / totalCount) * 100)
    : 0;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">漫画管理</h1>

      {/* 話選択 */}
      <select
        className="border p-2 w-full mb-2 rounded"
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

      {/* 話追加 */}
      <div className="flex gap-2 mb-2">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="新しい話"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />

        <button
          onClick={addEpisode}
          className="bg-blue-500 text-white px-4 rounded"
        >
          追加
        </button>
      </div>

      {/* 話削除 */}
      {current && (
        <button
          onClick={deleteEpisode}
          className="bg-red-500 text-white w-full p-2 rounded mb-4"
        >
          この話を削除
        </button>
      )}

      {!current && <p>まず話を追加してください</p>}

      {current && (
        <>
          {/* 今日だけ表示 */}
          <button
            onClick={() => setShowTodayOnly(!showTodayOnly)}
            className="bg-gray-200 w-full p-2 rounded mb-3"
          >
            {showTodayOnly ? "全部表示" : "今日だけ表示"}
          </button>

          {/* ページ数 */}
          <input
            type="number"
            placeholder="ページ数"
            className="border p-2 w-full rounded mb-2"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
          />

          <button
            onClick={generatePages}
            className="bg-blue-500 text-white w-full p-2 rounded mb-4"
          >
            ページ生成
          </button>

          {/* 日付 */}
          <input
            type="date"
            className="border p-2 w-full rounded mb-2"
            value={current.startDate}
            onChange={(e) => updateMeta("startDate", e.target.value)}
          />

          <input
            type="date"
            className="border p-2 w-full rounded mb-4"
            value={current.deadline}
            onChange={(e) => updateMeta("deadline", e.target.value)}
          />

          {/* ページ一覧 */}
          {visiblePages.map((p, i) => {
            const realIndex = current.pages.findIndex(
              (x) => x.page === p.page
            );

            return (
              <div
                key={p.page}
                className="border rounded p-3 mb-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span
                    className={
                      isPageComplete(p)
                        ? "line-through text-gray-400 font-bold"
                        : "font-bold"
                    }
                  >
                    p{p.page}
                  </span>

                  <div className="flex gap-2">
                    {[1, 2, 3].map((w) => (
                      <button
                        key={w}
                        onClick={() =>
                          updatePage(realIndex, "weight", w)
                        }
                        className={`px-3 py-1 border rounded ${
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
                  className="border p-2 w-full rounded"
                  value={p.date}
                  onChange={(e) =>
                    updatePage(realIndex, "date", e.target.value)
                  }
                />

                {/* 工程チェック */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.progress.name}
                      onChange={() =>
                        updateProgress(realIndex, "name")
                      }
                    />
                    ネーム
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.progress.draft}
                      onChange={() =>
                        updateProgress(realIndex, "draft")
                      }
                    />
                    下書き
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.progress.pen}
                      onChange={() =>
                        updateProgress(realIndex, "pen")
                      }
                    />
                    ペン入れ
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.progress.finish}
                      onChange={() =>
                        updateProgress(realIndex, "finish")
                      }
                    />
                    仕上げ
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.progress.tone}
                      onChange={() =>
                        updateProgress(realIndex, "tone")
                      }
                    />
                    トーン
                  </label>
                </div>
              </div>
            );
          })}

          {/* 日別スケジュール */}
          <h2 className="font-bold text-lg mt-4 mb-2">
            日別スケジュール
          </h2>

          {Object.entries(grouped)
            .sort()
            .map(([date, list]) => (
              <div
                key={date}
                className={`border rounded p-3 mb-2 ${
                  date === today ? "bg-yellow-100" : ""
                }`}
              >
                <p className="font-bold">
                  {date} {date === today && "← 今日"}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {list.map((p) => (
                    <span
                      key={p.page}
                      className={`px-2 py-1 border rounded text-sm ${
                        isPageComplete(p)
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

          {/* 進捗バー */}
          <div className="mt-6">
            <p className="mb-2 font-bold">
              全体進捗：{progressPercent}%
            </p>

            <div className="w-full bg-gray-200 h-4 rounded">
              <div
                className="bg-green-500 h-4 rounded"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;