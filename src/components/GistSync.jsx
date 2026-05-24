// components/GistSync.jsx
// Wklej ten komponent w /ustawienia, pod sekcją AI Mentor

import { useState, useEffect } from 'react';
import {
  IconBrandGithub,
  IconCloudUpload,
  IconCloudDownload,
  IconCheck,
  IconX,
  IconLoader2,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  getGithubToken,
  saveGithubToken,
  getGistId,
  zapiszNaGista,
  przywrocZGista,
  testujToken,
} from '../utils/gistSync';

export default function GistSync() {
  const [token, setToken] = useState('');
  const [tokenWidoczny, setTokenWidoczny] = useState(false);
  const [statusTokenu, setStatusTokenu] = useState(null); // null | 'ok' | 'blad'
  const [loginGithub, setLoginGithub] = useState('');
  const [testowanie, setTestowanie] = useState(false);

  const [zapisywanie, setZapisywanie] = useState(false);
  const [przywracanie, setPrzywracanie] = useState(false);
  const [wynikZapisu, setWynikZapisu] = useState(null);   // { url, liczbaKontaktow, dataBackupu }
  const [wynikPrzywracania, setWynikPrzywracania] = useState(null);
  const [blad, setBlad] = useState('');

  const [potwierdzPrzywracanie, setPotwierdzPrzywracanie] = useState(false);

  const gistId = getGistId();

  useEffect(() => {
    const zapisany = getGithubToken();
    if (zapisany) {
      setToken(zapisany);
      setStatusTokenu('ok');
    }
  }, []);

  // Autosave tokenu z debounce 800ms (wzorem pitch script)
  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => {
      saveGithubToken(token);
    }, 800);
    return () => clearTimeout(t);
  }, [token]);

  async function handleTestuj() {
    if (!token.trim()) return;
    setTestowanie(true);
    setBlad('');
    setStatusTokenu(null);
    try {
      const login = await testujToken(token.trim());
      setLoginGithub(login);
      setStatusTokenu('ok');
      saveGithubToken(token.trim());
    } catch (e) {
      setStatusTokenu('blad');
      setBlad(e.message);
    } finally {
      setTestowanie(false);
    }
  }

  async function handleZapisz() {
    setZapisywanie(true);
    setBlad('');
    setWynikZapisu(null);
    try {
      const wynik = await zapiszNaGista();
      setWynikZapisu(wynik);
    } catch (e) {
      setBlad(e.message);
    } finally {
      setZapisywanie(false);
    }
  }

  async function handlePrzywroc() {
    if (!potwierdzPrzywracanie) {
      setPotwierdzPrzywracanie(true);
      return;
    }
    setPrzywracanie(true);
    setBlad('');
    setWynikPrzywracania(null);
    setPotwierdzPrzywracanie(false);
    try {
      const wynik = await przywrocZGista();
      setWynikPrzywracania(wynik);
    } catch (e) {
      setBlad(e.message);
    } finally {
      setPrzywracanie(false);
    }
  }

  const maToken = token.trim().length > 0;
  const maGistId = !!gistId;

  return (
    <div className="card p-6 space-y-6">
      {/* Nagłówek */}
      <div className="flex items-center gap-3">
        <IconBrandGithub size={20} className="text-[#22D4F0]" />
        <div>
          <h3 className="text-sm font-semibold text-[#E2E8F0]">Backup — GitHub Gist</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Dane CRM zapisane jako prywatny Gist. Bezpłatne, z historią wersji.
          </p>
        </div>
      </div>

      {/* Token */}
      <div className="space-y-2">
        <label className="text-xs text-[#64748B] uppercase tracking-widest">
          GitHub Personal Access Token
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={tokenWidoczny ? 'text' : 'password'}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setStatusTokenu(null);
              }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-[#0B0D12] border border-[#253040] rounded px-3 py-2 text-sm
                         font-mono text-[#E2E8F0] placeholder-[#253040]
                         focus:outline-none focus:border-[#22D4F0] focus:ring-1 focus:ring-[#22D4F0]/30
                         pr-9"
            />
            <button
              onClick={() => setTokenWidoczny((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#E2E8F0]"
            >
              {tokenWidoczny ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </button>
          </div>
          <button
            onClick={handleTestuj}
            disabled={!maToken || testowanie}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40"
          >
            {testowanie ? (
              <IconLoader2 size={13} className="animate-spin" />
            ) : statusTokenu === 'ok' ? (
              <IconCheck size={13} className="text-[#10B981]" />
            ) : statusTokenu === 'blad' ? (
              <IconX size={13} className="text-red-400" />
            ) : null}
            Testuj
          </button>
        </div>

        {/* Status tokenu */}
        {statusTokenu === 'ok' && loginGithub && (
          <p className="text-xs text-[#10B981] flex items-center gap-1">
            <IconCheck size={11} /> Połączono jako <span className="font-mono">{loginGithub}</span>
          </p>
        )}
        {statusTokenu === 'blad' && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <IconX size={11} /> {blad}
          </p>
        )}

        {/* Instrukcja */}
        <p className="text-xs text-[#253040] leading-relaxed">
          Utwórz token na{' '}
          <a
            href="https://github.com/settings/tokens/new?scopes=gist&description=CRM+Salon+Urody"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#22D4F0] hover:underline inline-flex items-center gap-0.5"
          >
            github.com/settings/tokens <IconExternalLink size={10} />
          </a>
          {' '}— zakres uprawnień: tylko <span className="font-mono text-[#64748B]">gist</span>.
        </p>
      </div>

      {/* Akcje */}
      <div className="grid grid-cols-2 gap-3">
        {/* Zapisz */}
        <div className="space-y-1.5">
          <button
            onClick={handleZapisz}
            disabled={!maToken || zapisywanie}
            className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {zapisywanie ? (
              <IconLoader2 size={14} className="animate-spin" />
            ) : (
              <IconCloudUpload size={14} />
            )}
            {zapisywanie ? 'Zapisuję...' : maGistId ? 'Aktualizuj backup' : 'Utwórz backup'}
          </button>
          {wynikZapisu && (
            <div className="text-xs text-[#10B981] space-y-0.5">
              <p className="flex items-center gap-1">
                <IconCheck size={11} /> {wynikZapisu.liczbaKontaktow} kontaktów zapisanych
              </p>
              <a
                href={wynikZapisu.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#22D4F0] hover:underline flex items-center gap-0.5"
              >
                Otwórz Gist <IconExternalLink size={10} />
              </a>
            </div>
          )}
        </div>

        {/* Przywróć */}
        <div className="space-y-1.5">
          {potwierdzPrzywracanie ? (
            <div className="space-y-1.5">
              <p className="text-xs text-[#F59E0B] flex items-start gap-1">
                <IconAlertTriangle size={12} className="mt-0.5 shrink-0" />
                Nadpisze obecne dane. Na pewno?
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePrzywroc}
                  disabled={przywracanie}
                  className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  {przywracanie ? <IconLoader2 size={12} className="animate-spin" /> : 'Tak'}
                </button>
                <button
                  onClick={() => setPotwierdzPrzywracanie(false)}
                  className="flex-1 btn-secondary text-xs py-2"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePrzywroc}
              disabled={!maToken || !maGistId || przywracanie}
              className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {przywracanie ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconCloudDownload size={14} />
              )}
              {przywracanie ? 'Przywracam...' : 'Przywróć dane'}
            </button>
          )}
          {wynikPrzywracania && (
            <p className="text-xs text-[#10B981] flex items-center gap-1">
              <IconCheck size={11} /> Przywrócono {wynikPrzywracania.liczbaKontaktow} kontaktów
            </p>
          )}
          {!maGistId && maToken && (
            <p className="text-xs text-[#253040]">Wykonaj najpierw zapis.</p>
          )}
        </div>
      </div>

      {/* Błąd globalny */}
      {blad && statusTokenu !== 'blad' && (
        <p className="text-xs text-red-400 flex items-start gap-1.5">
          <IconX size={12} className="mt-0.5 shrink-0" />
          {blad}
        </p>
      )}

      {/* Info o Gist ID */}
      {maGistId && (
        <p className="text-xs text-[#253040] font-mono truncate">
          Gist: {gistId}
        </p>
      )}
    </div>
  );
}
