# Teacher Dashboard

Design and specs for the Lumi Schools Teacher Dashboard.

**Start here:** Read [HANDOVER.md](HANDOVER.md) for full context.

## Purpose

- **Set homework** – Weekly activities (Lees sinne, Spelling, Maths, Show and tell) + daily exercises (1–3 per day)
- **Set schoolwork** – In-class activities (same structure as homework)
- **View progress** – See which learners have completed the assigned work

## Status

Design/spec phase. No implementation yet.

## Wireframes

HTML mockups in `wireframes/`:

| Screen | File | Description |
|--------|------|-------------|
| Index | [index.html](wireframes/index.html) | Links to all wireframes |
| Dashboard | [dashboard.html](wireframes/dashboard.html) | Overview cards, this week's homework, quick actions |
| Set homework | [homework-picker.html](wireframes/homework-picker.html) | Weekly + daily activities, completion rate & missed homework per activity |
| Set schoolwork | [schoolwork-picker.html](wireframes/schoolwork-picker.html) | In-class activities (weekly + daily) |
| Progress | [progress.html](wireframes/progress.html) | Learner table: sentences, stars, time, status |

Open `wireframes/index.html` in a browser to browse. Homework/schoolwork have interactive day tabs. Each activity shows Completion rate and Missed homework.

To run locally:
```bash
cd teacher-dashboard/wireframes
python -m http.server 8082
```
Then open http://localhost:8082/

## Related

- Admin portal: `lekkeleer-lees/admin.html` (reference for layout patterns)
- Lumi Schools: `SAAS-LearningApp-ProjectOverview/phase-5.html`
