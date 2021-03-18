"use strict";

class Workout {
    date = new Date();
    id = (Date.now() + "").slice(-10);

    constructor (coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    setDescription () {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = "running";

    constructor (coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this.setDescription();
    }

    calcPace () {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this.setDescription();
    }

    calcSpeed () {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// ELEMENTS
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor () {

        this._getPosition();
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);

    }

    _getPosition () {

        if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function () {
        alert("Could not get the current position. Please try again by loading the page.")
        });
        } else {
            alert("Could not get the current position. Please update your browser.");
        }

    }

    _loadMap (position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;

        const coords = [latitude, longitude];
        this.#map = L.map("map").setView(coords, 13);
        L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png").addTo(this.#map);

        // HANDLING CLICKS ON MAP
        this.#map.on("click", this._showForm.bind(this));

    }

    _showForm (mapE) {

        form.classList.remove("hidden");
        inputDistance.focus();
        this.#mapEvent = mapE;

    }

    _hideForm () {
        // EMPTY INPUTS
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
        // HIDE FORM
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => form.style.display = "grid", 1000);
    }

    _toggleElevationField () {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkout (e) {

        e.preventDefault();

        // DATA VALIDATION FUNCTION
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        // GET DATA FROM FORM
        const type = inputType.value;
        const distance = +inputDuration.value;
        const duration = +inputDistance.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //IF WORKOUT IS RUNNING, CREATE RUNNING OBJECT
        if (type === "running") {
            const cadence = +inputCadence.value;
            // CHECK IF DATA IS VALID
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
                return alert("Inputs have to be only positive numbers!");

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // IF WORKOUT IS CYCLING, CREATE CYCLING OBJECT
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            // CHECK IF DATA IS VALID
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration))
                return alert("Inputs have to be only positive numbers!");

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // ADD NEW OBJECT TO WORKOUT ARRAY
        this.#workouts.push(workout);

        // RENDER WORKOUT ON MAP AS MARKER
        this._renderWorkoutMarker(workout);
    }

    _renderWorkoutMarker (workout) {

        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        })).setPopupContent(`${workout.type === "running" ? "🏃‍♂" : "🚴‍♀"} ${workout.description}`).openPopup();

        // RENDER WORKOUT ON THE LIST
        this._renderWorkout(workout);

        // HIDE FORM + CLEAR INPUTS
        this._hideForm();

    }

    _renderWorkout (workout) {
        let HTML =
            `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === "running" ? "🏃‍♂" : "🚴‍♀"}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
            `
        if (workout.type === "running")
            HTML += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>`
        if (workout.type === "cycling")
            HTML += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `
        form.insertAdjacentHTML("afterend", HTML);
    }
}

const app = new App();
