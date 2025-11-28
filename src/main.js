import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css"; // Tailwind entry (base/components/utilities)

createApp(App).use(router).mount("#app");
