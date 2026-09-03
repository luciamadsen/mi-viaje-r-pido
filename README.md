# Mi Viaje Rápido

Build a simple mobile-first web app for shuttle/van reservations.

IMPORTANT: The entire user-facing interface MUST be in Spanish. All buttons, labels, forms, messages and text must be in Spanish. Code can be in English.

The current reservation system is a WhatsApp group where passengers write messages like “Hola, me subo a Cabildo”. I want to replace this with a simple booking website.

Main idea

There is NO admin section and NO login.

Everyone who opens the website can see the current reservations in real time.

For example, on Thursday afternoon, a passenger can select Friday and immediately see how many people are traveling and who is getting on at each stop.

Passenger reservation

The passenger only needs to enter:

Nombre y apellido

Día del viaje

Parada donde sube

The boarding stop must be selected from a dropdown with these exact options:

Av. Antártida Argentina 1160 - Esquina Coto (entre Gendarmería y Coto)

Av. del Libertador 98 - Puesto de bicicletas GBA de la ciudad

Bouchard 557 - Parada de colectivo, frente a Torre Bouchard

Av. Córdoba 3789 - Carnicería RES (esquina Córdoba y Medrano)

Av. Santa Fe 4387 - Pasando la rotonda, cartel publicitario

Av. Santa Fe 4799 - Parada de colectivo sobre Santa Fe

Av. Dorrego 2762 - Puesto de diarios

Av. Cabildo 459 - Banco ISBC / Diagnóstico Maipú

Av. Cabildo 2877 - Puesto de diarios

Av. Cabildo 3511 - YPF

Av. Cabildo 4963 - GNC

There should be an easy option to select one specific day or automatically select the whole week.

Maximum capacity: 30 passengers per day.

After confirming, show:

“✅ Reserva confirmada”

with the person's name, selected day and boarding stop.

Live reservations

Everyone should be able to select a day and see the reservations for that day.

For example:

VIERNES 4 DE SEPTIEMBRE

16 / 30 lugares ocupados

CABILDО
8 pasajeros

Lucía

Sofía

Juan

BELGRANO
5 pasajeros

Pedro

Clara

The information should update automatically when someone makes or cancels a reservation.

Everyone can see this information. No admin permissions are needed.

Return trip

Do NOT ask passengers whether they are returning in the shuttle.

The reservation is only for the trip during the selected day.

After making a reservation, simply display this message:

“⚠️ Si no volvés en combi, avisá por el grupo de WhatsApp.”

This is only an informational message. There should be no return-trip button, form or reservation.

Week selection

Allow passengers to easily select:

Un solo día

Toda la semana

If “toda la semana” is selected, create the corresponding reservations for the available days of that week.

Design

Keep the interface very simple, clean, modern and mobile-first.

The main priority is that someone can open the link from WhatsApp and reserve their place in a few seconds.

The app should clearly show:

Selected day

Number of passengers

Passengers grouped by boarding stop

Available capacity

Build this as a functional MVP, not just a mockup.

Use a real database and make the reservations update in real time for everyone viewing the website.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1eb8d3d6-2240-44f4-b5fe-9b032a4fe6ea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
