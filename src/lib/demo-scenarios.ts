export const DEMO_COMMS = {
  audience: "Candidates" as const,
  incidentType: "Outage" as const,
  system: "Campus Wi-Fi & LMS Authentication",
  requesterEmail: "candidate@capaciti.org.za",
  subject: "Service Alert: Campus Wi-Fi & LMS Authentication Outage",
  details: `Start: 07:45 SAST, Cape Town campus (Floors 2-4).
Symptom: Candidates cannot associate with the CAPACITI-SECURE SSID; those on cellular data are also rejected at LMS sign-in ("invalid credentials").
Scope: ~180 candidates and 12 facilitators. Wired lab machines unaffected.
Cause so far: the RADIUS/identity service backing both Wi-Fi 802.1X and LMS single sign-on is refusing authentication requests after an overnight certificate rotation.
Workaround: use the CAPACITI-GUEST SSID (voucher at reception) and the LMS offline module pack for today's session.
Expected restoration: 11:00 SAST; next update at 09:30.`,
};

export const DEMO_POSTMORTEM = {
  context: "Docker permission socket failure — build agents offline, 2 Sep",
  logs: `[02:14:07] deploy-agent-03 $ docker compose up -d --build
[02:14:07] permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.45/containers/json": dial unix /var/run/docker.sock: connect: permission denied
[02:14:09] CI pipeline #4471 FAILED (stage: build) exit code 1
[02:15:31] deploy-agent-03 $ ls -l /var/run/docker.sock
srw-rw---- 1 root root 0 Sep  2 02:02 /var/run/docker.sock
[02:16:02] deploy-agent-03 $ id cirunner
uid=1004(cirunner) gid=1004(cirunner) groups=1004(cirunner)
[02:16:40] #ops-oncall  T. Mabaso: group "docker" is gone on 03 and 04. unattended-upgrades ran 01:58 and pulled docker-ce 26.x
[02:21:11] #ops-oncall  N. Petersen: post-install script recreated the socket before the group existed; cirunner lost membership on both agents
[02:35:00] deploy-agent-03 $ sudo groupadd -f docker && sudo usermod -aG cirunner docker
[02:36:12] docker: Error response from daemon: still permission denied (stale session)
[02:38:44] correction: sudo usermod -aG docker cirunner  (arguments were reversed)
[02:39:30] deploy-agent-03 $ sudo systemctl restart docker && sudo systemctl restart ci-runner
[02:41:05] CI pipeline #4473 PASSED
[02:44:18] same fix applied to deploy-agent-04, verified
[02:50:00] Total impact: 36 minutes of blocked builds, 9 queued pipelines, 1 delayed release to staging. No customer-facing outage.`,
};

export const DEMO_SHIFT = {
  shiftHours: 6,
  technicians: 3,
  tickets: `Network switch in the Woodstock server cupboard is overheating - fans audible, two access points already dropped, affects 60 candidates
Candidate forgot GitHub password and cannot push their capstone project due today
Boardroom projector shows "no signal" over HDMI - client demo scheduled at 14:00
Finance shared drive is read-only for three staff members since the morning restart
New cohort laptop imaging: 8 machines to prepare before Monday induction`,
};
