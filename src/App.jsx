// カレンダー機能追加版（完成版）
import { useEffect, useState } from "react";

function App() {
  const [episodes, setEpisodes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mangaTaskV9"));
    if (saved) setEpisodes(saved);
  }, []);

  const save = (data) => {
    setEpisodes(data);
    localStorage.setItem("mangaTaskV9", JSON.stringify(data));
  };

  const current = episodes[currentIndex];

  const addEpisode = () => {
    if (!newTitle) return;
    const updated = [
      ...episodes,
      {
        id: Date.now(),
        title: newTitle,
        pages: [],
        startDate: "",
        deadline: "",
      },
    ];
    save(updated);
    setNewTitle("");
    setCurrentIndex(updated.length - 1);
  };

  const deleteEpisode = () => {
    if (!current) return;
    if (!window.confirm("この話を削除しますか？")) return;
    const updated = episodes.filter((_, i) => i !== currentIndex);
    save(updated);
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const generatePages = () => {
    if (!current || !pageCount) return;
    const count = Number(pageCount);
    if (!count || count <= 0) return;

    const pages = Array.from({ length: count }, (_, i) => ({
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
    updated[currentIndex].pages = pages;
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

  const updateProgress = (index, key) => {
    const updated = [...episodes];
    updated[currentIndex].pages[index].progress[key] =
      !updated[currentIndex].pages[index].progress[key];
    save(updated);
  };

  const isComplete = (page) =>
    Object.values(page.progress).every(Boolean);

  const getCardStyle = (page) => {
    const count = Object.values(page.progress).filter(Boolean).length;
    if (count === 3) return "bg-green-50 border-green-300";
    if (count > 0) return "bg-yellow-50 border-yellow-300";
    return "bg-white border-gray-200";
  };

  const today = new Date().toISOString().split("T")[0];
  const todayPages = current?.pages.filter((p) => p.date === today) || [];

  let visiblePages = current?.pages || [];
  if (showTodayOnly) visiblePages = visiblePages.filter((p) => p.date === today);
  if (!showCompleted) visiblePages = visiblePages.filter((p) => !isComplete(p));

  const groupedByDate = (current?.pages || []).reduce((acc, page) => {
    if (!page.date) return acc;
    if (!acc[page.date]) acc[page.date] = [];
    acc[page.date].push(page);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <h1 className="text-2xl font-bold">漫画制作管理</h1>
          <p className="text-gray-600 mt-2">今日の予定：{todayPages.length}ページ</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-bold text-lg mb-3">📚 話管理</h2>
          <select
            className="border p-3 rounded-xl w-full mb-3"
            value={currentIndex}
            onChange={(e) => {
              setCurrentIndex(Number(e.target.value));
              setPageCount("");
            }}
          >
            {episodes.map((ep, i) => (
              <option key={ep.id} value={i}>{ep.title}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              className="border p-3 rounded-xl flex-1"
              placeholder="新しい話"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <button onClick={addEpisode} className="bg-blue-500 text-white px-4 rounded-xl">追加</button>
          </div>

          {current && (
            <button onClick={deleteEpisode} className="bg-red-500 text-white w-full p-3 rounded-xl mt-3">
              この話を削除
            </button>
          )}
        </div>

        {current && (
          <>
            <div className="bg-yellow-100 rounded-2xl shadow p-4">
              <h2 className="font-bold text-lg mb-3">🔥 今日やるページ</h2>
              {todayPages.length === 0 ? (
                <p>今日は予定がありません</p>
              ) : (
                todayPages.map((p) => {
                  const idx = current.pages.findIndex((x) => x.page === p.page);
                  return (
                    <div key={p.page} className="bg-white rounded-xl p-3 mb-2">
                      <p className="font-bold">p{p.page}</p>
                      {[['draft','下書き'],['pen','ペン入れ'],['finish','仕上げ']].map(([k,label]) => (
                        <label key={k} className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={p.progress[k]}
                            onChange={() => updateProgress(idx, k)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-4">
              <h2 className="font-bold text-lg mb-3">🗓 カレンダー表示</h2>
              {sortedDates.length === 0 ? (
                <p>まだ予定日がありません</p>
              ) : (
                <div className="space-y-3">
                  {sortedDates.map((date) => (
                    <div key={date} className="border rounded-xl p-3 bg-gray-50">
                      <p className="font-bold mb-2">{date}</p>
                      <div className="flex flex-wrap gap-2">
                        {groupedByDate[date].map((p) => (
                          <span
                            key={p.page}
                            className={`px-3 py-1 rounded-full border ${isComplete(p) ? 'bg-green-200' : 'bg-white'}`}
                          >
                            p{p.page}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowTodayOnly(!showTodayOnly)}
                className="flex-1 bg-gray-800 text-white p-3 rounded-xl"
              >
                {showTodayOnly ? '全部表示' : '今日だけ'}
              </button>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex-1 bg-gray-600 text-white p-3 rounded-xl"
              >
                {showCompleted ? '完了を隠す' : '完了も表示'}
              </button>
            </div>

            <div className="space-y-4">
              {visiblePages.map((p) => {
                const idx = current.pages.findIndex((x) => x.page === p.page);
                return (
                  <div key={p.page} className={`rounded-2xl shadow p-4 border ${getCardStyle(p)}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-lg">p{p.page}</span>
                      <div className="flex gap-2">
                        {[1,2,3].map((w) => (
                          <button
                            key={w}
                            onClick={() => updatePage(idx, 'weight', w)}
                            className={`w-10 h-10 rounded-xl border ${p.weight === w ? 'bg-green-400' : 'bg-white'}`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="date"
                      className="border p-3 rounded-xl w-full mb-3"
                      value={p.date}
                      onChange={(e) => updatePage(idx, 'date', e.target.value)}
                    />

                    {[['draft','下書き'],['pen','ペン入れ'],['finish','仕上げ']].map(([k,label]) => (
                      <label key={k} className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={p.progress[k]}
                          onChange={() => updateProgress(idx, k)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
