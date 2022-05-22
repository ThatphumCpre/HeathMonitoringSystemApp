// Set new default font family and font color to mimic Bootstrap's default styling

Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

// 

var max_spo2 = 100;
var min_spo2 = 0;
var max_bpm = 200;
var min_bpm = 100;


var app = firebase.initializeApp({
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
});


firebase.auth().signInWithEmailAndPassword("user1@example.com", "password");



const spo2 = document.getElementById('spo2val');
const heartbeat = document.getElementById('hbval');


var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

today =  yyyy + '-' + mm + '-' + dd;

var db = firebase.firestore();

function number_format(number, decimals, dec_point, thousands_sep) {
  // *     example: number_format(1234.56, 2, ',', ' ');
  // *     return: '1 234,56'
  number = (number + '').replace(',', '').replace(' ', '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function(n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.round(n * k) / k;
    };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}

// Area Chart Example



function addData(chart, label, data, id) {
  chart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
  });
  chart.update();
}

function removeData(chart) {
  chart.data.labels.pop();
  chart.data.datasets.forEach((dataset) => {
      dataset.data.pop();
      console.log(dataset.data.length);
      if (dataset.data.length > 0){
        removeData(chart)
      } 
  });
  chart.update();
}


async function getMarker() {
  const snapshot = await firebase.firestore().collection('sensor_log').get()
    const collection = {};
    snapshot.forEach(doc => {
        collection[doc.id] = doc.data();
    });
    return collection;
}




db.collection("sensor_log").doc(today).onSnapshot(function(docs){
  removeData(heartbeatchart);
  removeData(spo2chart);
  getMarker().then(data => {
    console.log(data);
    var sum_error = 0;
    var error_string = "";
    for (const [key, value] of Object.entries(data)) {
      console.log(key, value);
      for (const [keyi, valuei] of Object.entries(value)) {
        console.log(keyi, valuei);
        temp_time = valuei.timestamp.split(":")
        temp_date = key.split("-")
        temp_label = "วันที่ " + temp_date[2] + " "+temp_time[0]+":" +temp_time[1];
        heartbeatchart.data.labels.push(temp_label);
        spo2chart.data.labels.push(temp_label);
        addData(heartbeatchart,'2020-02-15 20:07:39', valuei.heartbeat_avg, "A");
        addData(spo2chart,'2020-02-15 20:07:39', valuei.spo2_avg, "B");
        heartbeat.innerText = valuei.heartbeat_avg + " BPM" ;
        spo2.innerText = valuei.spo2_avg + "%";
        if ( (valuei.heartbeat_avg > max_bpm) || (valuei.heartbeat_avg < min_bpm)) {
          sum_error += 1; 
          error_string = error_string + "Heartbeat "
        } 
        if ( (valuei.spo2_avg > max_spo2) || (valuei.spo2_avg < min_spo2)) {
          sum_error += 1; 
          error_string = error_string + "SpO2 "
        } 
      }
    }
    if (sum_error > 0) {
      alert_element = document.getElementById('alert'); 
      alert_element.innerText = error_string + 'มีปัญหา!!';
      alert_element.style.display = "block";
      alert_element.className = "alert alert-danger";
    }
    else {
      alert_element = document.getElementById('alert'); 
      alert_element.style.display = "none";
    }
  });
} 
); 



var i = 1 ;
function insertAppointment() {
  var table = document.getElementById('dataTable');
  var time = document.getElementById("time").value
  var row = table.insertRow(1);
  var cell = row.insertCell(0);
  var rowCount = table.rows.length;   
  console.log(rowCount);
  ;
  while (table.rows.length >4) {
    table.deleteRow(-1);
  }
  cell.innerHTML = time + ":00";


  db.collection('monitor').doc('time_assignment').get().then(function(docs){
    data = docs.data();
    if (data.timestamp1 == null ) {
      db.collection('monitor').doc('time_assignment').update({
        timestamp1: time + ":00"}
      );
    }
    else if(data.timestamp2 == null) {
      db.collection('monitor').doc('time_assignment').update({
        timestamp2: time + ":00"}
      );
    }
    else if(data.timestamp3 == null) {
      db.collection('monitor').doc('time_assignment').update({
        timestamp3: time + ":00"}
      );
    }
    else {
      if (i%3 == 1 ) {
        db.collection('monitor').doc('time_assignment').update({
          timestamp1: time + ":00"}
        );
      }
      else if(i%3 == 2) {
        db.collection('monitor').doc('time_assignment').update({
          timestamp2: time + ":00"}
        );
      }
      else if(i%3 == 0) {
        db.collection('monitor').doc('time_assignment').update({
          timestamp3: time + ":00"}
        );
      }
      i = i+1;
    }
  }); 

}


db.collection('monitor').doc('time_assignment').get().then(function(docs){
  for (const [key, value] of Object.entries(docs.data())) {
    var table = document.getElementById('dataTable');
    var time = document.getElementById("time").value
    var row = table.insertRow(1);
    var cell = row.insertCell(0);
    cell.innerHTML = value;
  }
});


var ctx = document.getElementById("myAreaChart");
var spo2chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: "SpO2",
      lineTension: 0.3,
      backgroundColor: "rgba(94, 197, 143)",
      borderColor: "rgba(78, 115, 223, 1)",
      pointRadius: 3,
      pointBackgroundColor: "rgba(78, 115, 223, 1)",
      pointBorderColor: "rgba(78, 115, 223, 1)",
      pointHoverRadius: 3,
      pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
      pointHoverBorderColor: "rgba(78, 115, 223, 1)",
      pointHitRadius: 10,
      pointBorderWidth: 2,
      data: [],
    },
    ],
  },
  options: {
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 25,
        top: 25,
        bottom: 0
      }
    },
    scales: {
      xAxes: [{
        time: {
          unit: 'date'
        },
        gridLines: {
          display: false,
          drawBorder: false
        },
        ticks: {
          maxTicksLimit: 7
        },
        barPercentage: 0.34,
      }],
      yAxes: [{
        position: 'left',
        ticks: {
          maxTicksLimit: 5,
          padding: 10,
          beginAtZero: true,
          // Include a dollar sign in the ticks
          callback: function(value, index, values) {
            return '%' + number_format(value);
          }
        },
        gridLines: {
          color: "rgb(234, 236, 244)",
          zeroLineColor: '#ffcc33',
          drawBorder: false,
          borderDash: [2],
          zeroLineBorderDash: [2]
        }
      }],
      
    },
    legend: {
      display: true
    },
    tooltips: {
      backgroundColor: "rgb(255,255,255)",
      bodyFontColor: "#858796",
      titleMarginBottom: 10,
      titleFontColor: '#6e707e',
      titleFontSize: 14,
      borderColor: '#dddfeb',
      borderWidth: 1,
      xPadding: 15,
      yPadding: 15,
      displayColors: false,
      intersect: false,
      mode: 'index',
      caretPadding: 10,
      callbacks: {
        label: function(tooltipItem, chart) {
          var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
          return datasetLabel + ':' + number_format(tooltipItem.yLabel);
        }
      }
    }
  }
});



// Area Chart Example
var ctx = document.getElementById("myAreaChart1");
var heartbeatchart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: "HEARTBEAT",
      lineTension: 0.3,
      backgroundColor: "rgba(240,128,128)",
      borderColor: "rgba(78, 115, 223, 1)",
      pointRadius: 3,
      pointBackgroundColor: "rgba(78, 115, 223, 1)",
      pointBorderColor: "rgba(78, 115, 223, 1)",
      pointHoverRadius: 3,
      pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
      pointHoverBorderColor: "rgba(78, 115, 223, 1)",
      pointHitRadius: 10,
      pointBorderWidth: 2,
      data: [],
    },
    ],
  },
  options: {
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 25,
        top: 25,
        bottom: 0
      }
    },
    scales: {
      xAxes: [{
        time: {
          unit: 'date'
        },
        gridLines: {
          display: false,
          drawBorder: false
        },
        ticks: {
          maxTicksLimit: 7
        },
        barPercentage: 0.34,
      }],
      yAxes: [{
        position: 'left',
        ticks: {
          maxTicksLimit: 5,
          padding: 10,
          beginAtZero: true,
          // Include a dollar sign in the ticks
          callback: function(value, index, values) {
            return '' + number_format(value);
          }
        },
        gridLines: {
          color: "rgb(234, 236, 244)",
          zeroLineColor: '#ffcc33',
          drawBorder: false,
          borderDash: [2],
          zeroLineBorderDash: [2]
        }
      }],
      
    },
    legend: {
      display: true
    },
    tooltips: {
      backgroundColor: "rgb(255,255,255)",
      bodyFontColor: "#858796",
      titleMarginBottom: 10,
      titleFontColor: '#6e707e',
      titleFontSize: 14,
      borderColor: '#dddfeb',
      borderWidth: 1,
      xPadding: 15,
      yPadding: 15,
      displayColors: false,
      intersect: false,
      mode: 'index',
      caretPadding: 10,
      callbacks: {
        label: function(tooltipItem, chart) {
          var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
          return datasetLabel + ':' + number_format(tooltipItem.yLabel);
        }
      }
    }
  }
});



heartbeatchart.update();
spo2chart.update();


db.collection("monitor").doc("status").onSnapshot(function(docs){
  bool = docs.data().alert_status; 
  if (bool) {
    console.log(bool);
    alert_element = document.getElementById('alert'); 
    alert_element.innerText = 'Status is on';
    alert_element.style.display = "block";
    alert_element.className = "alert alert-warning";
  }
  else {
    alert_element = document.getElementById('alert'); 
    alert_element.style.display = "none";
  }
}
);

