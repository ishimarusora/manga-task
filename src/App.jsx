import { useEffect, useState } from "react";

function App() {
  const [episodes, setEpisodes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mangaTaskV7"));
    if (saved) {
      setEpisodes(saved);
    }
  }, []);

  const save = (data) => {
    const cloned = JSON.parse(JSON.stringify(data));
    setEpisodes(cloned);
    localStorage.setItem("mangaTaskV7", JSON.stringify(cloned));
  };

  const current = episodes[currentIndex];

  const addEpisode = () => {
    if (!newTitle.trim()) return;

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
        draft: false,
        pen: false,
        finish: false,
      },
    }));

    const updated = [...episodes];
    updated[currentIndex] = {
      ...updated[currentIndex],
      pages: arr,
    };

    save(updated);
  };

  const updateMeta = (key, value) => {
    const updated = [...episodes];
    updated[currentIndex] = {
      ...updated[currentIndex],
      [key]: value,
    };
    save(updated);
  };

  const updatePage = (index, key, value) => {
    const updated = [...episodes];

    updated[currentIndex].pages[index] = {
      ...updated[currentIndex].pages[index],
      [key]: value,
    };

    save(updated);
  };

  const updateProgress = (index, progressKey) => {
    const updated = [...episodes];
    const targetPage = updated[currentIndex].pages[index];

    updated[currentIndex].pages[index] = {
      ...targetPage,
      progress: {
        ...targetPage.progress,
        [progressKey]: !targetPage.progress[progressKey],
      },
    };

    save(updated);
  };

  const isPageComplete = (page) => {
    return Object.values(page.progress).every(Boolean);
  };

  const getProgressStatus = (page) => {
    const values = Object.values(page.progress);
    const done = values.filter(Boolean).length;

    if (done === 0) return "notStarted";
    if (done === values.length) return "completed";
    return "inProgress";
  };

  const getCardStyle = (page) => {
    const status = getProgressStatus(page);

    if (status === "completed") {
      return "bg-green-50 border-green-300";
    }

    if (status === "inProgress") {
      return "bg-yellow-50 border-yellow-300";
    }

    return "bg-white border-gray-200";
  };

  const today = new Date().toISOString().split("T")[0];

  const todayPages =
    current?.pages.filter((p) => p.date === today) || [];

  let visiblePages = current?.pages || [];

  if (showTodayOnly) {
    visiblePages = visiblePages.filter((p) => p.date === today);
  }

  if (!showCompleted) {
    visiblePages = visiblePages.filter((p) => !isPageComplete(p));
  }

  const doneCount =
    current?.pages.filter((p) => isPageComplete(p)).length || 0;

  const totalCount = current?.pages.length || 0;

  const progressPercent = totalCount
    ? Math.round((doneCount / totalCount) * 100)
    : 0;

  const remainingDays =
    current?.deadline
      ? Math.ceil(
          (new Date(current.deadline) - new Date()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-4">

        {/* ホーム */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h1 className="text-2xl font-bold mb-2">
            漫画制作管理
          </h1>

          <p className="text-gray-600">
            今日の予定：
            <span className="font-bold ml-1">
              {todayPages.length}ページ
            </span>
          </p>

          {remainingDays !== null && (
            <p className="text-gray-600">
              締切まであと：
              <span className="font-bold text-red-500 ml-1">
                {remainingDays}日
              </span>
            </p>
          )}
        </div>

        {/* 話管理 */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-bold text-lg mb-3">
            📚 話管理
          </h2>

          <select
            className="border p-3 rounded-xl w-full mb-3"
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

          <div className="flex gap-2">
            <input
              className="border p-3 rounded-xl flex-1"
              placeholder="新しい話"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <button
              onClick={addEpisode}
              className="bg-blue-500 text-white px-4 rounded-xl"
            >
              追加
            </button>
          </div>

          {current && (
            <button
              onClick={deleteEpisode}
              className="bg-red-500 text-white w-full p-3 rounded-xl mt-3"
            >
              この話を削除
            </button>
          )}
        </div>

        {!current && (
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            まず話を追加してください
          </div>
        )}

        {current && (
          <>
            {/* 今日やるページ */}
            <div className="bg-yellow-100 rounded-2xl shadow p-4">
              <h2 className="font-bold text-lg mb-3">
                🔥 今日やるページ
              </h2>

              {todayPages.length === 0 ? (
                <p>今日は予定がありません</p>
              ) : (
                <div className="space-y-3">
                  {todayPages.map((p) => {
                    const realIndex = current.pages.findIndex(
                      (x) => x.page === p.page
                    );

                    return (
                      <div
                        key={p.page}
                        className="bg-white rounded-xl p-3"
                      >
                        <p className="font-bold mb-2">
                          p{p.page}
                        </p>

                        <div className="space-y-2">
                          {[
                            ["draft", "下書き"],
                            ["pen", "ペン入れ"],
                            ["finish", "仕上げ"],
                          ].map(([key, label]) => (
                            <label
                              key={key}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={p.progress[key]}
                                onChange={() =>
                                  updateProgress(realIndex, key)
                                }
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 基本設定 */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h2 className="font-bold text-lg mb-3">
                ⚙️ 基本設定
              </h2>

              <label className="font-semibold block mb-1">
                ページ数
              </label>
              <input
                type="number"
                className="border p-3 rounded-xl w-full mb-2"
                placeholder="ページ数を入力"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
              />

              <button
                onClick={generatePages}
                className="bg-blue-500 text-white w-full p-3 rounded-xl mb-4"
              >
                ページ生成
              </button>

              <label className="font-semibold block mb-1">
                開始日
              </label>
              <input
                type="date"
                className="border p-3 rounded-xl w-full mb-3"
                value={current.startDate}
                onChange={(e) =>
                  updateMeta("startDate", e.target.value)
                }
              />

              <label className="font-semibold block mb-1">
                締切日
              </label>
              <input
                type="date"
                className="border p-3 rounded-xl w-full"
                value={current.deadline}
                onChange={(e) =>
                  updateMeta("deadline", e.target.value)
                }
              />
            </div>

            {/* 表示切替 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowTodayOnly(!showTodayOnly)}
                className="flex-1 bg-gray-800 text-white p-3 rounded-xl"
              >
                {showTodayOnly ? "全部表示" : "今日だけ"}
              </button>

              <button
                onClick={() =>
                  setShowCompleted(!showCompleted)
                }
                className="flex-1 bg-gray-600 text-white p-3 rounded-xl"
              >
                {showCompleted
                  ? "完了を隠す"
                  : "完了も表示"}
              </button>
            </div>

            {/* ページ一覧 */}
            <div className="space-y-4">
              {visiblePages.map((p) => {
                const realIndex = current.pages.findIndex(
                  (x) => x.page === p.page
                );

                return (
                  <div
                    key={p.page}
                    className={`rounded-2xl shadow p-4 border ${getCardStyle(
                      p
                    )}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-lg">
                        p{p.page}
                      </span>

                      <div className="flex gap-2">
                        {[1, 2, 3].map((w) => (
                          <button
                            key={w}
                            onClick={() =>
                              updatePage(realIndex, "weight", w)
                            }
                            className={`w-10 h-10 rounded-xl border ${
                              p.weight === w
                                ? "bg-green-400"
                                : "bg-white"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="font-semibold block mb-1">
                      作業予定日
                    </label>

                    <input
                      type="date"
                      className="border p-3 rounded-xl w-full mb-3"
                      value={p.date}
                      onChange={(e) =>
                        updatePage(realIndex, "date", e.target.value)
                      }
                    />

                    <div className="space-y-2">
                      {[
                        ["draft", "下書き"],
                        ["pen", "ペン入れ"],
                        ["finish", "仕上げ"],
                      ].map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={p.progress[key]}
                            onChange={() =>
                              updateProgress(realIndex, key)
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 全体進捗 */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h2 className="font-bold text-lg mb-2">
                📈 全体進捗
              </h2>

              <p className="font-semibold mb-2">
                {progressPercent}% 完了
              </p>

              <div className="w-full bg-gray-200 h-4 rounded-full">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">
                完了：{doneCount} / {totalCount} ページ
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;