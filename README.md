# Ironstone

Ironstone is a browser-based sales demo for three independent businesses: Boreholes, Asbestos Removal and Plant Hire. Each workspace has its own enquiries, quotations, clients and follow-ups. **See how it works** opens the guided WhatsApp simulation and writes its sample records into the chosen workspace.

## Run locally

From the repository root, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://localhost:8000). The app uses HTML, CSS and JavaScript modules with no build step. Data stays in this browser using local storage. **Replay** restarts the guided workflow for the selected business and removes its prior guided-demo records. **Reset demo data** restores the initial records across all three workspaces.

WhatsApp and email actions are simulations. The homepage shows seven days of enquiry activity and the earliest outstanding follow-ups from the three workspaces. Its borehole-site photography slowly zooms in and out. Reduced-motion preferences disable that motion and the dashboard entrance effects. The business photography is original generated artwork for this demo with 3840 px wide workspace backdrop exports. Inter Tight and JetBrains Mono ship with their SIL Open Font Licenses in `assets/fonts`.
