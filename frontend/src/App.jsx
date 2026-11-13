import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const iconPaths = {
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  arrowDown: <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>,
  arrowUp: <><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
};

function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", options).format(date);
}

function getLastSevenDays(users) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const counts = days.map((day) => ({
    label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(day),
    date: day,
    count: 0,
  }));
  users.forEach(({ created_at: createdAt }) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return;
    date.setHours(0, 0, 0, 0);
    const day = counts.find((item) => item.date.getTime() === date.getTime());
    if (day) day.count += 1;
  });
  return counts;
}

function downloadCsv(users) {
  const rows = [
    ["Name", "Email", "Joined"],
    ...users.map((user) => [
      user.name,
      user.email,
      user.created_at ? formatDate(user.created_at) : "",
    ]),
  ];
  const csv = `\uFEFF${rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => {
    throw new Error("The server returned an invalid response. Please try again.");
  });
  if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

function App() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState("overview");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("memberdesk-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await request("/users");
      if (!Array.isArray(data)) throw new Error("The server returned an unexpected users list.");
      setUsers(data);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("memberdesk-theme", theme);
    } catch {
      // Theme selection still works when browser storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    document.getElementById("member-name")?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, saving]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((user) => !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
        if (sort === "name") return a.name.localeCompare(b.name);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [search, sort, users]);

  const today = new Date();
  const thisMonthCount = users.filter((user) => {
    const joined = new Date(user.created_at);
    return !Number.isNaN(joined.getTime())
      && joined.getMonth() === today.getMonth()
      && joined.getFullYear() === today.getFullYear();
  }).length;
  const thisWeekCount = users.filter((user) => {
    const joined = new Date(user.created_at);
    return !Number.isNaN(joined.getTime())
      && (today - joined) < 7 * 24 * 60 * 60 * 1000
      && joined <= today;
  }).length;
  const chartDays = useMemo(() => getLastSevenDays(users), [users]);
  const chartMax = Math.max(1, ...chartDays.map((day) => day.count));
  const mostRecent = users.reduce((latest, user) => {
    if (!latest || new Date(user.created_at) > new Date(latest.created_at)) return user;
    return latest;
  }, null);

  function openCreateModal() {
    setEditingUser(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const user = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
    };
    if (user.name.length < 2) {
      setFormError("Please enter a name with at least 2 characters.");
      return;
    }
    if (user.name.length > 100 || user.email.length > 254) {
      setFormError("Please shorten the name or email address and try again.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const isEditing = Boolean(editingUser);
      await request(`/users${isEditing ? `/${editingUser.id}` : ""}`, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(user),
      });
      setModalOpen(false);
      setNotice(isEditing ? "Member details updated." : "Member added successfully.");
      await loadUsers();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Remove ${user.name} from your members? This can't be undone.`)) return;
    try {
      await request(`/users/${user.id}`, { method: "DELETE" });
      setNotice(`${user.name} was removed.`);
      await loadUsers();
    } catch (error) {
      setNotice(error.message);
    }
  }

  function openPage(nextPage) {
    setPage(nextPage);
    setMobileNavOpen(false);
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#overview" onClick={() => openPage("overview")}>
          <span className="brand-mark"><Icon name="spark" size={21} /></span>
          <span>member<span className="brand-light">desk</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-link ${page === "overview" ? "nav-link-active" : ""}`} onClick={() => openPage("overview")}>
            <Icon name="grid" /><span>Overview</span>
          </button>
          <button className={`nav-link ${page === "members" ? "nav-link-active" : ""}`} onClick={() => openPage("members")}>
            <Icon name="users" /><span>Members</span><span className="nav-count">{users.length}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon"><Icon name="activity" size={18} /></div>
            <strong>Your people, in one place.</strong>
            <p>A clear view of your growing community.</p>
            <button onClick={openCreateModal}><Icon name="plus" size={15} /> Add a member</button>
          </div>
          <div className="sidebar-profile">
            <div className="profile-avatar">M</div>
            <div className="profile-copy"><strong>Workspace admin</strong><span>Member directory</span></div>
            <span className="online-dot" aria-label="Workspace ready" />
          </div>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{page === "overview" ? "Overview" : "Members"}</strong></div>
          <div className="topbar-actions">
            <span className="today-label"><Icon name="calendar" size={15} /> {formatDate(new Date(), { weekday: "short", month: "short", day: "numeric" })}</span>
            <button
              className="icon-button theme-toggle"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              <Icon name={theme === "light" ? "moon" : "sun"} />
            </button>
            <div className="topbar-avatar" title="Workspace admin">M</div>
          </div>
        </header>

        <div className="page-content">
          {loadError && (
            <div className="error-banner" role="alert">
              <span>{loadError}</span>
              <button onClick={loadUsers}>Try again</button>
            </div>
          )}

          {page === "overview" ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> YOUR COMMUNITY AT A GLANCE</div>
                  <h1>A little more <span>connected.</span></h1>
                  <p className="welcome-description">Here’s what’s happening with your members today.</p>
                </div>
                <button className="button-primary" onClick={openCreateModal}><Icon name="plus" size={17} /> Add a member</button>
              </section>

              <section className="stats-grid" aria-label="Member statistics">
                <article className="stat-card">
                  <div className="stat-top"><span>Total members</span><span className="stat-icon stat-icon-lilac"><Icon name="users" /></span></div>
                  <div className="stat-number">{loading ? <span className="skeleton skeleton-number" /> : users.length}</div>
                  <div className="stat-foot"><span className="stat-foot-icon"><Icon name="activity" size={14} /></span> All registered members</div>
                </article>
                <article className="stat-card">
                  <div className="stat-top"><span>Joined this month</span><span className="stat-icon stat-icon-peach"><Icon name="calendar" /></span></div>
                  <div className="stat-number">{loading ? <span className="skeleton skeleton-number" /> : thisMonthCount}</div>
                  <div className="stat-foot"><span className="stat-foot-icon"><Icon name="arrowUp" size={14} /></span> New this month</div>
                </article>
                <article className="stat-card">
                  <div className="stat-top"><span>New this week</span><span className="stat-icon stat-icon-mint"><Icon name="spark" /></span></div>
                  <div className="stat-number">{loading ? <span className="skeleton skeleton-number" /> : thisWeekCount}</div>
                  <div className="stat-foot"><span className="stat-foot-icon"><Icon name="activity" size={14} /></span> In the last 7 days</div>
                </article>
                <article className="stat-card">
                  <div className="stat-top"><span>Latest member</span><span className="stat-icon stat-icon-blue"><Icon name="plus" /></span></div>
                  <div className="stat-latest">{loading ? <span className="skeleton skeleton-name" /> : mostRecent?.name || "—"}</div>
                  <div className="stat-foot"><span className="stat-foot-muted">{mostRecent ? formatDate(mostRecent.created_at) : "Your community is ready"}</span></div>
                </article>
              </section>

              <section className="overview-grid">
                <article className="panel trend-panel">
                  <div className="panel-heading">
                    <div><h2>Member growth</h2><p>New sign-ups over the last 7 days</p></div>
                    <span className="panel-heading-tag"><span className="tag-dot" /> Last 7 days</span>
                  </div>
                  {loading ? (
                    <div className="chart-loading" aria-label="Loading sign-up chart"><span /><span /><span /><span /><span /><span /><span /></div>
                  ) : users.length === 0 ? (
                    <div className="chart-empty"><span className="empty-icon"><Icon name="activity" /></span><strong>Your story starts here</strong><span>Add your first member to see sign-up activity.</span></div>
                  ) : (
                    <div className="chart" role="img" aria-label={`Member sign-ups for the last seven days: ${chartDays.map((day) => `${day.label} ${day.count}`).join(", ")}`}>
                      <div className="chart-grid-lines"><span /><span /><span /></div>
                      <div className="chart-bars">
                        {chartDays.map((day) => (
                          <div className="chart-column" key={day.date.toISOString()}>
                            <span className="bar-value">{day.count || ""}</span>
                            <div className="bar-track"><div className={`bar-fill ${day.count ? "" : "bar-zero"}`} style={{ height: `${Math.max(4, (day.count / chartMax) * 100)}%` }} /></div>
                            <span className="bar-label">{day.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="chart-footer"><span><span className="legend-dot" /> New members</span><span>{thisWeekCount} joined this week</span></div>
                </article>

                <article className="panel welcome-panel">
                  <span className="welcome-spark"><Icon name="spark" size={21} /></span>
                  <span className="welcome-panel-label">A SPACE THAT GROWS WITH YOU</span>
                  <h2>Good things happen when people come together.</h2>
                  <p>Keep your community close. Add members and watch your network grow, one connection at a time.</p>
                  <button className="text-button" onClick={openCreateModal}>Add someone new <Icon name="chevron" size={15} /></button>
                  <div className="welcome-decoration welcome-decoration-one" />
                  <div className="welcome-decoration welcome-decoration-two" />
                </article>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading recent-heading">
                  <div><h2>Recently joined</h2><p>Your latest community members</p></div>
                  <button className="button-secondary" onClick={() => openPage("members")}>View all <Icon name="chevron" size={15} /></button>
                </div>
                <UserTable
                  users={[...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)}
                  loading={loading}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  compact
                />
              </section>
            </>
          ) : (
            <>
              <section className="members-heading">
                <div>
                  <div className="eyebrow"><span className="eyebrow-dot" /> YOUR COMMUNITY</div>
                  <h1>Your <span>members.</span></h1>
                  <p className="welcome-description">The people who make this community what it is.</p>
                </div>
                <button className="button-primary" onClick={openCreateModal}><Icon name="plus" size={17} /> Add a member</button>
              </section>

              <section className="panel directory-panel">
                <div className="directory-toolbar">
                  <div className="directory-title"><div><h2>All members</h2><p>{loading ? "Loading your community…" : `${filteredUsers.length} ${filteredUsers.length === 1 ? "person" : "people"} in your community`}</p></div></div>
                  <div className="directory-controls">
                    <label className="search-field">
                      <Icon name="search" size={17} />
                      <input type="search" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
                      {search && <button aria-label="Clear search" onClick={() => setSearch("")}><Icon name="close" size={14} /></button>}
                    </label>
                    <label className="sort-field"><span className="sr-only">Sort members</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></label>
                    <button className="button-secondary export-button" onClick={() => downloadCsv(filteredUsers)} disabled={loading || filteredUsers.length === 0} title="Download the visible members as a CSV"><Icon name="download" size={16} /><span>Export</span></button>
                  </div>
                </div>
                <UserTable users={filteredUsers} loading={loading} onEdit={openEditModal} onDelete={handleDelete} search={search} />
              </section>
              <p className="directory-note"><Icon name="check" size={15} /> Your member information is kept in sync with your database.</p>
            </>
          )}
        </div>
        <footer className="page-footer"><span>Made for the people who make it matter.</span><span>Memberdesk <span className="footer-dot">·</span> Community management</span></footer>
      </main>

      {notice && <div className={`toast ${notice.includes("server") || notice.includes("try again") ? "toast-error" : ""}`} role="status"><span className="toast-check"><Icon name={notice.includes("server") || notice.includes("try again") ? "close" : "check"} size={15} /></span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
          <section className="member-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-heading">
              <span className="modal-icon"><Icon name={editingUser ? "edit" : "users"} size={20} /></span>
              <button className="icon-button modal-close" onClick={() => setModalOpen(false)} disabled={saving} aria-label="Close dialog"><Icon name="close" /></button>
              <span className="eyebrow"><span className="eyebrow-dot" /> MEMBER DIRECTORY</span>
              <h2 id="modal-title">{editingUser ? "A little update." : "Someone new."}</h2>
              <p>{editingUser ? "Keep their details up to date." : "Add a new person to your community."}</p>
            </div>
            <form className="member-form" onSubmit={handleSave}>
              <label htmlFor="member-name">Full name</label>
              <input id="member-name" name="name" type="text" placeholder="e.g. Alex Morgan" autoComplete="name" minLength={2} maxLength={100} defaultValue={editingUser?.name || ""} required />
              <label htmlFor="member-email">Email address</label>
              <input id="member-email" name="email" type="email" placeholder="e.g. alex@example.com" autoComplete="email" maxLength={254} defaultValue={editingUser?.email || ""} required />
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="form-actions"><button type="button" className="button-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button><button type="submit" className="button-primary" disabled={saving}>{saving ? "Saving…" : editingUser ? "Save changes" : "Add member"}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function UserTable({ users, loading, onEdit, onDelete, compact = false, search = "" }) {
  if (loading) {
    return <div className="table-loading" aria-label="Loading members"><span /><span /><span /></div>;
  }
  if (users.length === 0) {
    return (
      <div className="table-empty">
        <span className="empty-icon"><Icon name={search ? "search" : "users"} size={21} /></span>
        <strong>{search ? "No one found just yet." : "It’s a little quiet in here."}</strong>
        <span>{search ? "Try another name or email address." : "Your members will appear here once they join."}</span>
      </div>
    );
  }
  return (
    <div className="table-scroll">
      <table className={compact ? "members-table compact-table" : "members-table"}>
        <thead><tr><th>MEMBER</th><th>EMAIL ADDRESS</th><th>DATE JOINED</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id}>
              <td><div className="member-cell"><span className={`member-avatar avatar-${index % 5}`}>{getInitials(user.name)}</span><span className="member-name">{user.name}</span></div></td>
              <td><a className="member-email" href={`mailto:${user.email}`}><Icon name="mail" size={15} />{user.email}</a></td>
              <td><span className="joined-date">{formatDate(user.created_at)}</span></td>
              <td><div className="row-actions"><button className="row-action" aria-label={`Edit ${user.name}`} title="Edit member" onClick={() => onEdit(user)}><Icon name="edit" size={16} /></button><button className="row-action row-action-delete" aria-label={`Remove ${user.name}`} title="Remove member" onClick={() => onDelete(user)}><Icon name="close" size={16} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
