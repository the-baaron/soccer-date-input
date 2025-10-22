# Soccer Date Input

An interactive game for entering dates by kicking a soccer ball into numbered targets.

## Concept

- A soccer pitch (800x500px centered in the view) with a player and ball
- Numbers 0-9 are randomly positioned around the pitch on load
- Player controls: Arrow keys to move the player
- When the player gets close to the ball, they kick it
- Ball bounces off walls with physics
- When ball hits a number, that digit is added to the date input
- Goal: Enter a valid date in DDMMYYYY format (e.g., 25122024 for December 25, 2024)
- After 8 digits, validate the date
- Show overlay for invalid dates (with retry) or valid dates (with confirmation)

## Technical Requirements

- Simple HTML/CSS/JavaScript (no frameworks)
- Player: light Blue oval for the shoulders and brown circle on top (centered) for the head (60x80px)
- Ball: White circle (30x30px)
- Player starts left-center, ball starts in center
- Numbers randomized each game
- Physics: momentum, friction, wall bounces
- Date validation using JavaScript Date object

## Files

- `index.html` - Structure
- `styles.css` - Styling
- `script.js` - Game logic
