const express = require("express");
const url = require("url");
const firebase = require("firebase-admin");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const axios = require("axios");
let router = express.Router();


function getPatients() {
    const ref = firebase.database().ref("patients_flattened/");
    return ref.once("value").then(snap => snap.val());
}

/* GET geofence page. */
router.get("/", (req, res, next) => {
    let data = url.parse(req.url, true).query;
    let hrefQuery = "?uid="+ data.uid;

    let patient_objs = {};
    getPatients().then(patients => {
        for (patient in patients){
            if (patients[patient].carerID === data.uid){
                patient_objs[patient] = patients[patient];
            }
        }
    }).then(() => {
        res.render("geofence", {title: "Add a Geofence", userQuery: hrefQuery, patients: patient_objs, carerId: data.uid});
    });
});

router.post("/add", urlencodedParser, (req, res) => {
    let data = url.parse(req.url, true).query;
    let carerId = req.body.carerId;

    let addr_input = req.body.address + " , Ireland";
    console.log(req.body);
    let patient_uid = req.body.patient_uid;

    axios.get("https://maps.google.com/maps/api/geocode/json", {
        params: {
            address: addr_input
        }
    })
    .then((response) => {
        console.log(response.data.results[0].formatted_address);
        console.log(response.data.results[0].geometry.location.lat);
        console.log(response.data.results[0].geometry.location.lng);

        let lat = response.data.results[0].geometry.location.lat;
        let long = response.data.results[0].geometry.location.lng;

        // if lat is undefined, so is long. Checks if address query returned valid result
        if (lat !== "undefined") {
            let long_ref = firebase.database().ref("patients_flattened/" + patient_uid + "/geofenceLong");
            long_ref.set(long);
            let lat_ref = firebase.database().ref("patients_flattened/" + patient_uid + "/geofenceLat");
            lat_ref.set(lat);
            let radius_ref = firebase.database().ref("patients_flattened/" + patient_uid + "/geofenceRadius");
            radius_ref.set(0.001);
        }
    })
    .then(()=> {
        let redir_url = "/home?uid=" + carerId;
        res.redirect(redir_url);
    })
    .catch((error) => {
        let redir_url = "/home?uid=" + carerId;
        res.redirect(redir_url);
    });
});

module.exports = router;
