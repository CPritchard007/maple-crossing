import { createApp } from "vue";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import Aura from "@primeuix/themes/aura";
import "primeicons/primeicons.css";
import "leaflet/dist/leaflet.css";
import "./styles/main.scss";
import App from "./App.vue";

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: "[data-theme='dark']",
    },
  },
});
app.use(ConfirmationService);
app.use(ToastService);
app.mount("#app");
