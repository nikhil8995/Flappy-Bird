# Flappy Bird (Node.js, HTML, CSS, JS)

A simple Flappy Bird clone playable in your browser, served by a Node.js/Express server.

## Features
- Responsive design for desktop and mobile
- Animated flapping bird using two PNG frames
- Moving cloud background
- Curved, bumpy ground at the bottom (classic style)
- Improved pipe graphics with gradient, rim, and shadow
- "Tap anywhere to flap!" overlay for new players
- Sound effects for flapping and collisions (see below)
- Best score saved in browser localStorage
- Playable from any device on your local network

## Setup

1. **Clone or download this repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Add your bird images:**
   - Place your two bird frame images in the `public` directory as `frame-1.png` (wings up) and `frame-2.png` (wings down).
   - Recommended size: 40x40px to 60x60px PNG with transparency.
4. **Add sound effects:**
   - Place `flap.mp3` (flap sound) and `hit.mp3` (collision sound) in the `public` directory.
   - You can use your own or find free sounds online.
5. **Start the server:**
   ```bash
   npm start
   ```
6. **Open the game:**
   - On your computer: [http://localhost:3000](http://localhost:3000)
   - On another device: [http://YOUR_WINDOWS_IP:3000](http://YOUR_WINDOWS_IP:3000)

## Controls
- **Desktop:** Press the Spacebar to flap.
- **Mobile:** Tap anywhere on the game area to flap.

## Sound Effects
- Add `flap.mp3` and `hit.mp3` to the `public` folder for sound effects.
- Flap sound plays on every flap; hit sound plays on collision/game over.

## Customization
- Change the bird images by replacing `frame-1.png` and `frame-2.png` in the `public` folder.
- Adjust game difficulty or appearance by editing `public/game.js` and `public/style.css`.
- You can swap out sound effects by replacing the `.mp3` files.

## Troubleshooting
- If you see a white screen, check the browser console for image or sound loading errors.
- Make sure your images are named exactly `frame-1.png` and `frame-2.png` (case-sensitive).
- For network play, ensure port 3000 is open and port forwarding is set up if using WSL2.

## License
This project is for educational/demo purposes. Use and modify freely. 