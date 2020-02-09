// 地圖初始化
var latitude = 25.0226;
var longitude = 121.5266;
var map = L.map('mapid').setView([latitude, longitude], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoon: 11,
    maxZoom: 19,
    attribution: 'Create by <a href="mail:yjc.ptt@gmail.com">YJC</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
var markers = new L.MarkerClusterGroup().addTo(map);;

// 取得使用者當前座標
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(showPosition);
}
function showPosition(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    console.log("取得地理位置，經度:"+latitude+" 緯度:"+longitude);
    // 座標移至使用者當前位置
    map.setView([latitude, longitude], 16);
    // 顯示使用者座標
    var myLocation = L.marker([latitude, longitude], {icon: blueIcon}).addTo(map).bindPopup("你在這裡").openPopup();
}

// 地圖標示初始化 (Leaflet color marks)
var greenIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
  

// 取得口罩資料
// https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json
// https://kiang.github.io/pharmacies/json/points.json
let getMask = new XMLHttpRequest();
    getMask.open('GET', 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json', true);
    getMask.send(null);
    getMask.onload = () => {
        let getMaskData = JSON.parse(getMask.responseText);
        // console.table(getMaskData.features);

        // 藥局資料
        // let markers = [];
        for (var i = 0; i < getMaskData.features.length; i++) {
            //計算營業日
            var today = 
            // 內文
            infoStr =
                '<h1> ' + getMaskData.features[i].properties.name + '</h1>' +
                '<div>' + getMaskData.features[i].properties.address +'</div>' +
                '<div>聯絡電話｜<a href="tel:' + getPhoneNumber() + '">'+ getMaskData.features[i].properties.phone +'</a> ☎</div>' +
                '<div>更新時間｜' + getMaskData.features[i].properties.updated +'</a></div>' +
                '<div>備註：' + getMaskData.features[i].properties.note + '</div>' +
                '<div class="card">' + getBusinessInfo(getMaskData.features[i].properties.available) + '</div>' +
                '<div class="card">' +
                '<div class="btn mask-amount" style="background:' + getColor(getMaskData.features[i].properties.mask_adult) + '">成人口罩 ' + getMaskData.features[i].properties.mask_adult + '個</div>' +
                '<div class="btn mask-amount" style="background:' + getColor(getMaskData.features[i].properties.mask_child) + '">兒童口罩 ' + getMaskData.features[i].properties.mask_child + '個</div>' +
                '</div>' +
                '<a class="btn navigation" href="'+ goNavigation(getMaskData.features[i].properties) + '" target="_blank">Google 路線導航</a>';

            // 依庫存數量判定顏色
            // 灰色:庫存=0
            if (getMaskData.features[i].properties.mask_adult + getMaskData.features[i].properties.mask_child == 0) {
                circleMarkerOptions = {
                    weight: 2,
                    color: "#6C757D"
                };
                markers.addLayer(L.marker(getLatLng(), {icon: greyIcon}).bindPopup(infoStr));
            // 紅色:庫存<50
            } else if (getMaskData.features[i].properties.mask_adult + getMaskData.features[i].properties.mask_child < 50) {
                circleMarkerOptions = {
                    weight: 2,
                    color: "#E31A1C"
                };
                markers.addLayer(L.marker(getLatLng(), {icon: redIcon}).bindPopup(infoStr));
            // 黃色:庫存<50
            } else if (getMaskData.features[i].properties.mask_adult + getMaskData.features[i].properties.mask_child < 100) {
                circleMarkerOptions = {
                    weight: 2,
                    color: "#FD8D3C"
                };
                markers.addLayer(L.marker(getLatLng(), {icon: yellowIcon}).bindPopup(infoStr));
            // 綠色:庫存>100
            } else {
                circleMarkerOptions = {
                    weight: 2,
                    color: "#155724"
                };
                markers.addLayer(L.marker(getLatLng(), {icon: greenIcon}).bindPopup(infoStr));
            };
        };
        map.addLayer(markers);
        // 取得座標
        function getLatLng() {
            return [
                getMaskData.features[i].geometry.coordinates[1], getMaskData.features[i].geometry.coordinates[0]
            ];
        };
        // 取得電話號碼
        function getPhoneNumber(){
            return[
                getMaskData.features[i].properties.phone.replace(/ |-/g,"")
            ];
        }
        // 導航
        function goNavigation(pharmacy){
            return[
                "https://www.google.com/maps/search/?api=1&query=" + pharmacy.name + "+" + pharmacy.address
            ];
        }
    }

// 地圖資訊
var infoMap = L.control();
infoMap.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info-map'); // 建立div元素，並包含map-info的class屬性
    div.innerHTML = '<b>台灣藥局口罩庫存地圖</b><br/>地圖資料每 30 秒更新一次。';
    return div;
};
infoMap.addTo(map);

// 標示資訊
var infoLegend = L.control({position: 'bottomleft'});
infoLegend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info-legend'),
        grades = [0, 50, 100],
        labels = [];
    div.innerHTML = '口罩數量<br>' +
                    '<i style="background:' + getColor(grades[0]) + '"></i> 無庫存 <br>'
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
};
infoLegend.addTo(map);

// 庫存顏色
function getColor(d) {
    return d > 100  ? '#155724' :
           d > 50   ? '#FD8D3C' :
           d > 0    ? '#E31A1C' : 
                      '#6C757D';
}

/** 
 * 取得今天是星期幾
 * new Date().getDay(); // 會是 0 ~ 6 的值, 分別代表下述:
 *  0 星期日, 
 *  1 星期一
 *  2 星期二
 *  3 星期三
 *  4 星期四
 *  5 星期五
 *  6 星期六
*/
function getDay(){
    const dayList = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const today = new Date().getDay();
    return dayList[today];
};

// 取得營業狀況
function getBusinessInfo(time){
    // var time = "星期一上午看診、星期二上午看診、星期三上午看診、星期四上午看診、星期五上午看診、星期六上午看診、星期日上午看診、星期一下午看診、星期二下午看診、星期三下午看診、星期四下午看診、星期五下午看診、星期六下午看診、星期日下午休診、星期一晚上看診、星期二晚上看診、星期三晚上看診、星期四晚上看診、星期五晚上看診、星期六晚上看診、星期日晚上看診"
    time = time.split("、"); //營業時間轉物件
    var today = new Object();
    today.week = getDay(); //取得今天是星期幾
    today.morning = false;
    today.afternoon = false;
    today.evening = false;
    //搜尋今日營業狀況
    for (var i = 0; i < time.length; i++) {
        if(time[i].match(today.week+"上午看診"))
            today.morning = true
        if(time[i].match(today.week+"下午看診"))
            today.afternoon = true
        if(time[i].match(today.week+"晚上看診"))
            today.evening = true
    }

    if (today.morning && today.afternoon && today.evening) {
        return '<div class="btn open">今日營業</div>';
    }else if (!today.morning && !today.afternoon && !today.evening) {
        return '<div class="btn close">今日休息</div>';
    }else{
        var info = '<div class="btn business-info '+ (today.morning ? 'open' : 'close') + '">上午' + (today.morning ? '營業' : '休息') + '</div>' +
        '<div class="btn business-info '+ (today.afternoon ? 'open' : 'close') + '">下午' + (today.afternoon ? '營業' : '休息') + '</div>' +
        '<div class="btn business-info '+ (today.evening ? 'open' : 'close') + '">晚上' + (today.evening ? '營業' : '休息') + '</div>'
        return info;
    }
}