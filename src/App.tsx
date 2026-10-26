import { useEffect, useMemo, useState } from 'react';
import { Book, Plus, Library, Trash2, Check, AlertCircle } from 'lucide-react';

type Status = 'want' | 'reading' | 'finished';

interface BookItem {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<
  Status,
  { label: string; dot: string; chip: string }
> = {
  want: {
    label: 'Want to Read',
    dot: 'bg-amber-400',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  reading: {
    label: 'Reading',
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  finished: {
    label: 'Finished',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
};

const FILTERS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'want', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'finished', label: 'Finished' },
];

const STORAGE_KEY = 'reading-list-books';
const MAX_TITLE_LENGTH = 60;

function loadBooks(): BookItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b) =>
        b &&
        typeof b.id === 'string' &&
        typeof b.title === 'string' &&
        b.title.trim().length > 0 &&
        (b.status === 'want' || b.status === 'reading' || b.status === 'finished')
    );
  } catch {
    return [];
  }
}

function App() {
  const [books, setBooks] = useState<BookItem[]>(() => loadBooks());
  const [title, setTitle] = useState('');
  const [initialStatus, setInitialStatus] = useState<Status>('want');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const counts = useMemo(() => {
    return books.reduce(
      (acc, b) => {
        acc[b.status] += 1;
        return acc;
      },
      { want: 0, reading: 0, finished: 0 } as Record<Status, number>
    );
  }, [books]);

  const visibleBooks = useMemo(() => {
    const list =
      filter === 'all' ? books : books.filter((b) => b.status === filter);
    return [...list].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    );
  }, [books, filter]);

  const isDuplicate = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase();
    return books.some(
      (b) => b.title.trim().replace(/\s+/g, ' ').toLowerCase() === normalized
    );
  };

  const addBook = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim().replace(/\s+/g, ' ');
    if (!trimmed) return;
    if (trimmed.length > MAX_TITLE_LENGTH) {
      setError('Book title must be 60 characters or fewer.');
      return;
    }
    if (isDuplicate(trimmed)) {
      setError('This book is already in your reading list.');
      return;
    }
    const book: BookItem = {
      id: crypto.randomUUID(),
      title: trimmed,
      status: initialStatus,
    };
    setBooks((prev) => [book, ...prev]);
    setTitle('');
    setInitialStatus('want');
    setError(null);
  };

  const changeStatus = (id: string, status: Status) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    setMenuOpenId(null);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (error) setError(null);
  };

  const removeBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setMenuOpenId((open) => (open === id ? null : open));
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white shadow-sm">
              <Library className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                Reading List
              </h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Track the books you want to read, are reading, and have finished.
              </p>
            </div>
          </div>
        </header>

        {/* Add form */}
        <form
          onSubmit={addBook}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <label
            htmlFor="book-title"
            className="mb-2 block text-sm font-medium text-stone-700"
          >
            Add a book
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Book
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
                strokeWidth={1.8}
              />
              <input
                id="book-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter book title"
                maxLength={MAX_TITLE_LENGTH}
                className={`w-full rounded-xl border bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder:text-stone-400 transition focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:bg-white ${
                  error
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
                    : 'border-stone-300 focus:border-stone-900 focus:ring-stone-900/10'
                }`}
                autoComplete="off"
              />
            </div>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value as Status)}
              className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-700 transition focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              aria-label="Reading status"
            >
              <option value="want">Want to Read</option>
              <option value="reading">Reading</option>
              <option value="finished">Finished</option>
            </select>
            <button
              type="submit"
              disabled={!title.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              Add
            </button>
          </div>
          {error ? (
            <p
              role="alert"
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600"
            >
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
              {error}
            </p>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                {title.trim().length}/{MAX_TITLE_LENGTH} characters
              </span>
            </div>
          )}
        </form>

        {/* Summary */}
        {books.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Total Books
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">
                {books.length}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Currently Reading
              </p>
              <p className="mt-1 text-2xl font-semibold text-sky-600">
                {counts.reading}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Finished
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {counts.finished}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        {books.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count =
                f.key === 'all' ? books.length : counts[f.key as Status];
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-stone-900/15 ${
                    active
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* List / empty state */}
        <div className="mt-6">
          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Book className="h-7 w-7" strokeWidth={1.6} />
              </div>
              <p className="text-base font-medium text-stone-700">
                Your reading list is empty. Add your first book.
              </p>
            </div>
          ) : visibleBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
              <p className="text-base font-medium text-stone-700">
                No books in this category yet.
              </p>
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-sm font-medium text-stone-500 underline underline-offset-2 hover:text-stone-800"
              >
                View all books
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visibleBooks.map((book) => {
                const meta = STATUS_META[book.status];
                const open = menuOpenId === book.id;
                return (
                  <li
                    key={book.id}
                    className="group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className="truncate text-base font-semibold text-stone-900"
                          title={book.title}
                        >
                          {book.title}
                        </h3>
                        <span
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                          />
                          {meta.label}
                        </span>
                      </div>

                      <div className="relative flex shrink-0 items-center gap-1">
                        <button
                          onClick={() =>
                            setMenuOpenId((open ? null : book.id))
                          }
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900/15"
                          aria-haspopup="menu"
                          aria-expanded={open}
                          aria-label="Change status"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => removeBook(book.id)}
                          className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium text-stone-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                          aria-label={`Delete ${book.title}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                          Delete
                        </button>

                        {open && (
                          <div
                            role="menu"
                            className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
                          >
                            {(Object.keys(STATUS_META) as Status[]).map(
                              (s) => {
                                const isActive = s === book.status;
                                return (
                                  <button
                                    key={s}
                                    role="menuitem"
                                    onClick={() => changeStatus(book.id, s)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`}
                                      />
                                      {STATUS_META[s].label}
                                    </span>
                                    {isActive && (
                                      <Check
                                        className="h-4 w-4 text-stone-900"
                                        strokeWidth={2.2}
                                      />
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-stone-400">
          Saved on this device.
        </footer>
      </div>
    </div>
  );
}

export default App;
