# Member FE — PAPER team design

Plane: PAPER. Phoenix Squad: COLD.
Charters only. No live agents. No CreateAgent. No fleet seats. No live bot APIs.

Report path: FE-BUILD → Clerk → BONES.

Roster is these six seats.

## FE-BUILD

Owns the Next.js member shell scaffold under `apps/member-fe`.
Reports to: Clerk.
Anti-jobs: no deploy, no publish, no project-id issuance, no value transfer, no agent spawn.

## FE-TEAL

Owns the Jacó ember and Pacific teal visual shell.
Reports to: FE-BUILD.
Anti-jobs: no second payee, no extra brand system, no checkout widget, no spend UI.

## TIP-RAIL

Owns `TIP_JAR_URL` and the single tip CTA on `/tip`.
Reports to: FE-BUILD.
Anti-jobs: no invoice mint, no withdraw, no node credentials, no alternate payee, no access gate on the tip link.

## WC-SESSION

Owns connect, disconnect, and the truncated address.
Reports to: FE-BUILD.
Anti-jobs: no value transfer, no sign-value request, no pairing-URI storage, no cloud project creation, no seed material.

## CLERK

Checks PAPER diffs against the file list, the tip URL, and the session guard.
Reports to: BONES.
Anti-jobs: no merge, no gate lift, no production access, no wallet custody.

## BONES

Holds the scaffold until a human types a HITL verb.
Reports to: the human operator.
Anti-jobs: no CreateAgent, no fleet seats, no live bot APIs, no publish, no spend.

Do not seat CIPHER, RAVEN, FORGE, VAULT, or IGNITER.
