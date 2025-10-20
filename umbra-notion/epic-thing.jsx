import React, { useEffect, useMemo, useRef, useState } from "react";

function formatUKTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}.${get("minute")}${(get("dayPeriod") || "").toLowerCase()}`;
}

const ALLOWED_USERS = ["harry.doling", "brendan.hill", "raff.nunn"];
const LS_CURRENT_USER = "oct_current_user";
const LS_DATA_PREFIX = "oct_data_";

function loadCurrentUser() {
  try {
    return localStorage.getItem(LS_CURRENT_USER) || "";
  } catch {
    return "";
  }
}
function saveCurrentUser(username) {
  try {
    if (username) localStorage.setItem(LS_CURRENT_USER, username);
    else localStorage.removeItem(LS_CURRENT_USER);
  } catch {}
}
function loadUserData(username) {
  try {
    const raw = localStorage.getItem(LS_DATA_PREFIX + username);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveUserData(username, records) {
  try {
    localStorage.setItem(LS_DATA_PREFIX + username, JSON.stringify(records));
  } catch {}
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function normalizeNumber(n) {
  return (n || "").replace(/\D+/g, "");
}

function LoginButton({ currentUser, onLogin, onLogout }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="absolute top-4 left-4 z-50">
      {currentUser ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{currentUser}</span>
          <button
            className="px-3 py-1 text-sm rounded-xl border border-gray-300 hover:bg-gray-50"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      ) : (
        <button
          className="px-4 py-2 rounded-xl border border-gray-300 shadow-sm hover:bg-gray-50"
          onClick={() => setOpen(true)}
        >
          Log in
        </button>
      )}
      {open && !currentUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Sign in</h2>
            <input
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              placeholder="Username"
              className="w-full border rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-black/20"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!ALLOWED_USERS.includes(username)) {
                    setError("Unknown username");
                    return;
                  }
                  onLogin(username);
                  setOpen(false);
                }
                if (e.key === "Escape") setOpen(false);
              }}
            />
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-xl border border-gray-300"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-black text-white"
                onClick={() => {
                  if (!ALLOWED_USERS.includes(username)) {
                    setError("Unknown username");
                    return;
                  }
                  onLogin(username);
                  setOpen(false);
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputPanel({ currentUser, onAdd }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const nameRef = useRef(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, [currentUser]);
  const submit = () => {
    if (!currentUser) return;
    const record = {
      id: uid(),
      name: name.trim(),
      number: number.trim(),
      notes: notes.trim(),
      timestamp: formatUKTimestamp(new Date()),
      createdAtISO: new Date().toISOString(),
    };
    onAdd(record);
    setName("");
    setNumber("");
    setNotes("");
    nameRef.current?.focus();
  };
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Quick input</h2>
      </div>
      <div className="flex flex-col gap-3">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (name || number || notes)) submit();
          }}
        />
        <input
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Number (optional)"
          className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (name || number || notes)) submit();
          }}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full h-40 border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-black/20"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
        />
      </div>
      <div className="mt-4">
        <button
          disabled={!currentUser}
          onClick={submit}
          className={`px-4 py-2 rounded-xl ${
            currentUser ? "bg-black text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          Add record
        </button>
      </div>
      {!currentUser && <p className="text-sm text-red-600 mt-2">Log in to save entries.</p>}
    </div>
  );
}

function SearchPanel({ records, onDelete }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  const results = useMemo(() => {
    const qn = normalizeNumber(q);
    const ql = q.toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const nameHit = (r.name || "").toLowerCase().includes(ql);
      const numHit = normalizeNumber(r.number).includes(qn);
      const noteHit = (r.notes || "").toLowerCase().includes(ql);
      return nameHit || numHit || noteHit;
    });
  }, [q, records]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Search</h2>
      </div>
      <div>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or number"
          className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
      </div>
      <div className="mt-3 flex-1 min-h-0">
        {!selected ? (
          <div className="border rounded-xl divide-y overflow-auto">
            {results.map((r) => (
              <div key={r.id} className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{r.name || "(No name)"}</div>
                  <div className="text-sm text-gray-600 ml-2">{r.timestamp}</div>
                </div>
                <div className="text-sm text-gray-700 truncate">{r.number || "(No number)"}</div>
                {r.notes && <div className="text-xs text-gray-500 line-clamp-2">{r.notes}</div>}
                <button
                  className="mt-2 inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                  onClick={() => onDelete(r.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M9 3h6a1 1 0 011 1v1h4a1 1 0 110 2h-1v12a3 3 0 01-3 3H8a3 3 0 01-3-3V7H4a1 1 0 110-2h4V4a1 1 0 011-1zm1 4a1 1 0 10-2 0v10a1 1 0 102 0V7zm6 0a1 1 0 10-2 0v10a1 1 0 102 0V7zM9 4v1h6V4H9z" />
                  </svg>
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(loadCurrentUser());
  const [records, setRecords] = useState(() => (currentUser ? loadUserData(currentUser) : []));
  useEffect(() => {
    if (currentUser) {
      saveCurrentUser(currentUser);
      setRecords(loadUserData(currentUser));
    }
  }, [currentUser]);
  useEffect(() => {
    if (currentUser) saveUserData(currentUser, records);
  }, [currentUser, records]);
  const handleAdd = (record) => setRecords((prev) => [record, ...prev]);
  const handleDelete = (id) => setRecords((prev) => prev.filter((r) => r.id !== id));
  const handleLogin = (u) => setCurrentUser(u);
  const handleLogout = () => setCurrentUser("");
  return (
    <div className="relative min-h-screen bg-gray-50">
      <LoginButton currentUser={currentUser} onLogin={handleLogin} onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          <section className="bg-white rounded-2xl shadow-sm p-4 overflow-hidden">
            <SearchPanel records={records} onDelete={handleDelete} />
          </section>
          <section className="bg-white rounded-2xl shadow-sm p-4 overflow-hidden">
            <InputPanel currentUser={currentUser} onAdd={handleAdd} />
          </section>
        </main>
      </div>
    </div>
  );
}
