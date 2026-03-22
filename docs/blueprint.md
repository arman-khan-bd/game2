# **App Name**: Spin & Win Hub

## Core Features:

- Participant Management: An input area to add customer names, which are then displayed in a clean, scrollable list within the application.
- Interactive Raffle Board: A horizontal 'Selection Bar' or 'Carousel' that displays all added customer names, styled like a CS:GO Case Opening slider, with a fixed center pointer.
- Pre-Spin Winner Logic: Uses Math.random() to determine the winning name before the animation starts, ensuring precise landing.
- Dynamic Spin Animation: Utilizes Framer Motion for rapid cycling and gradual deceleration of the raffle board to the pre-selected winner, including a visual 'bounce' or 'click' when a name passes the center pointer.
- Winner Reveal & Celebration: Triggers a celebratory UI with confetti (using canvas-confetti) and displays the winner's name in a Shadcn Dialog/Modal once the spin stops.

## Style Guidelines:

- Primary brand color: A vibrant, deep indigo (#5B57E9) to provide emphasis and energetic focal points.
- Background color: A dark, desaturated blue-grey (#191A1F) for a sleek, dark-mode aesthetic that allows primary elements to stand out.
- Accent color: A bright, sky-blue (#7ED0FF) for highlights, interactive elements, and to provide vibrant contrast against the dark background.
- Body and headline font: 'Space Grotesk' (sans-serif) for a modern, techy, and performance-oriented feel, suitable for both titles and shorter text blocks.
- Use modern, minimalist icons, with a focus on celebratory visuals and clear interaction indicators (e.g., play/pause for spin, add/delete for participants).
- Clean and organized layout with a clear input area for participants and a prominent horizontal 'Selection Bar' in the center for the raffle board, designed to be responsive.
- Smooth Framer Motion transitions for the raffle spin using a custom cubic-bezier ease for a 'heavy' deceleration feel, complemented by subtle hover effects and the celebratory confetti.