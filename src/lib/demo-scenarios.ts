export const DEMO_COMMS = {
  requesterEmail: "candidate.demo@capaciti.org.za",
  audience: "All CAPACITI Staff & Candidates" as const,
  communicationType: "Urgent System Outage Alert" as const,
  systemAffected: "Campus Wi-Fi & LMS Authentication Down",
  tone: "Urgent & Direct" as const,
  keyDetails:
    "Switch failure at main rack; Lab 1 & 2 impacted; use 'CAPACITI-Guest' workaround; ETA 15:30.",
  subject: "URGENT OUTAGE ALERT: Campus Wi-Fi & LMS Authentication Down (Labs 1 & 2)",
};

export const DEMO_POSTMORTEM = {
  context: "Docker Socket Permission Failure on Lab PCs — Cape Town Tech Labs",
  logs: `[08:14:02] lab-pc-01 $ docker compose up -d --build
[08:14:03] permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.45/containers/json": dial unix /var/run/docker.sock: connect: permission denied
[08:14:15] Lab 2 Web Dev Cohort #24 FAILED to launch database container (exit code 1)
[08:15:31] lab-pc-01 $ ls -l /var/run/docker.sock
srw-rw---- 1 root root 0 Sep  4 08:02 /var/run/docker.sock
[08:16:02] lab-pc-01 $ id student-runner
uid=1004(student-runner) gid=1004(student-runner) groups=1004(student-runner)
[08:16:40] #ops-slack  T. Mabaso: Docker group is missing on lab-pc-01 through lab-pc-24. Nightly security patch ran 02:00 and updated docker-ce to v26.1.
[08:21:11] #ops-slack  N. Petersen: Package post-install script recreated socket before docker group was created; student-runner lost secondary group memberships.
[08:25:00] lab-pc-01 $ sudo groupadd -f docker && sudo usermod -aG docker student-runner
[08:26:12] docker: Error response from daemon: still permission denied (active user session has stale GID token)
[08:28:44] lab-pc-01 $ sudo systemctl restart docker && newgrp docker
[08:30:05] lab-pc-01 $ docker run hello-world
Hello from Docker! (Success)
[08:34:18] Ansible automation playbook "fix-docker-perms.yml" deployed across all 24 lab workstations.
[08:38:00] Total impact: 42 minutes of interrupted lab coding, 28 candidates affected, 0 permanent data loss.`,
};

export const DEMO_SHIFT = {
  shiftHours: 6,
  technicians: 3,
  tickets: `1. Core network switch in Woodstock server cupboard is overheating (fans loud, 82°C, 2 APs dropped, Lab 1 & 2 offline)
2. Candidate forgot GitHub password and 2FA credentials; cannot push final capstone evaluation due today at 17:00
3. Main Boardroom projector shows "no signal" over HDMI - client demo scheduled with partner sponsors at 14:00
4. Staff room printer toner replacement: HP LaserJet flashing "Replace Black Toner Cartridge" (error 59.F0)
5. Python lab installation: Data Science Lab 3 (24 workstations) requires Python 3.11, VS Code, and virtualenv configured for new cohort`,
};
