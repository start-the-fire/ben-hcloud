import Catalog from "./lib/Catalog";
import HttpClient from "./lib/nodes/HttpClient";

export default new Catalog(
    "my second test",
    "my second description",
    "https://app.helmut.cloud/img/logo_white.webp",
    "1.5.0",
    HttpClient
);
