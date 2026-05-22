import { execSync } from 'node:child_process';

const PORT = 5173;

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    }
  } catch {
    // Ignore failures for already-dead processes.
  }
}

function getListeningPidsWindows(port) {
  const psCmd = [
    `$conns = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue`,
    `if ($conns) { $conns | Select-Object -ExpandProperty OwningProcess -Unique }`,
  ].join('; ');

  let output = '';
  try {
    output = execSync(`powershell -NoProfile -Command "${psCmd}"`, { encoding: 'utf8' });
  } catch {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+$/.test(line));
}

function freePortWindows(port) {
  const pids = getListeningPidsWindows(port);
  for (const pid of pids) killPid(pid);

  // Verify once more to handle race conditions where the process lingers briefly.
  const remaining = getListeningPidsWindows(port);
  for (const pid of remaining) killPid(pid);
}

if (process.platform === 'win32') {
  freePortWindows(PORT);
}
