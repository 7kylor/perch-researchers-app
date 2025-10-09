import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export type AppSettings = {
  autoUpdateEnabled: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  autoUpdateEnabled: true,
};

let cachedSettings: AppSettings | null = null;
let settingsPath: string | null = null;

function getSettingsFilePath(): string {
  if (settingsPath) return settingsPath;
  const dir = app.getPath('userData');
  settingsPath = path.join(dir, 'settings.json');
  return settingsPath;
}

export function loadSettings(): AppSettings {
  if (cachedSettings) return cachedSettings;
  const file = getSettingsFilePath();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    cachedSettings = { ...DEFAULT_SETTINGS, ...parsed } satisfies AppSettings;
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS };
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(cachedSettings, null, 2), 'utf8');
    } catch {
      // ignore write errors on first run
    }
  }
  return cachedSettings;
}

export function getSettings(): AppSettings {
  return loadSettings();
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const next: AppSettings = { ...current, ...partial };
  const file = getSettingsFilePath();
  try {
    fs.writeFileSync(file, JSON.stringify(next, null, 2), 'utf8');
    cachedSettings = next;
  } catch {
    // keep cached settings even if write fails
    cachedSettings = next;
  }
  return next;
}


