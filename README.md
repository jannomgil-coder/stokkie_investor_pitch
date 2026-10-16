# Stokkie | Your stokvel, sorted

A mobile-first web app that helps stokvel (community savings) groups track contributions, remind late members on WhatsApp and run a fair payout rotation.

**Live app:** add your Vercel link here
**Author:** Jenet Gilman ([GitHub](https://github.com/jannomgil-coder))
**Built for:** ASA 23 design-thinking and investor-pitch project

## The problem
About 800,000 stokvels with more than 11 million members save roughly R50 billion a year in South Africa (figures from the National Stokvel Association of South Africa, NASASA). Many groups still track payments in notebooks and WhatsApp messages. Payments get lost, chasing late members is awkward, and disputes damage trust.

## Target user
The stokvel treasurer or chairperson: a busy person managing 8 to 20 members, mostly from their phone. Group members are the second user, because they get transparency.

## Key features
- **Contribution tracker:** tick a member as paid and watch the pot and progress ring update
- **WhatsApp reminders:** remind one member or everyone in one tap
- **Payout schedule:** a clear rotation showing who is paid out each month, with a "Mark paid out" record
- **Payment history:** a full record of who paid what and when, with a copy-as-text option
- **Group settings:** add or remove members, set the order and the monthly amount
- Saves data on the device and can be added to a phone home screen

## Why it is better
Notebooks get lost, WhatsApp chats get buried, and spreadsheets are hard to use on a phone. Stokkie is built for the stokvel routine: one simple screen, WhatsApp-first and free to start.

## Tech
Plain HTML, CSS and JavaScript. No framework, no build step, no server. Data is saved in the browser (localStorage), so nothing leaves the user's phone.

## Run locally
Open `index.html` in a browser. Use a phone-sized window for the best view.

## Deploy
**Vercel:** Add New Project, import this repository, then Deploy. No settings needed.

## Project structure
```
index.html            app shell and navigation
style.css             mobile-first design
script.js             app logic: members, payments, payouts, WhatsApp links
manifest.webmanifest  lets users add the app to their home screen
favicon.svg           app icon
docs/PITCH_SCRIPT.md  the 2-minute investor pitch
```

## Roadmap
- Payments inside the app (EFT or mobile wallets) and automatic reconciliation
- Automatic reminders and notifications
- Multiple stokvels per user, isiZulu, Sesotho and Afrikaans, and shared access for members
- Reports for treasurers and registered stokvels

## Notes
This is a prototype. The demo data is fictional. The app records payments that members report; it does not move money.
