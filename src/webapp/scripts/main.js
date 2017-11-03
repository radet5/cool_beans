var nameList = document.querySelector('.nameList');
var nameField = document.querySelector('.nameField');
var output = document.querySelector('.test');
var searchDiv = document.getElementById('search_div');
nameField.focus();

function clearList(list) {
    while (list.hasChildNodes()) {
        list.removeChild(list.firstChild);
    }
};

function sendToServer(socket, json_text, console) {

        if (socket.readyState == socket.OPEN) {
                socket.send(json_text);
        }
        else {
            clearList(console);
            var msg = document.createElement("h2");
            var subtext = document.createElement("div");
            msg.textContent = "Connection Error:";
            subtext.innerHTML = "<p>Socket is not open</p>";
            console.appendChild(msg);
            console.appendChild(subtext);
        }
}

function createRadioList(div, data, name, ids_key, labels_key) {
   for (i = 0; i < data.length; i++) {
       var radio = document.createElement("input");
       radio.setAttribute("type", "radio");
       radio.name = name;
       radio.value = data[i][ids_key];
       radio.id = data[i][labels_key];
       div.appendChild(radio);
       var label = document.createElement("label");
       label.setAttribute("for",data[i][labels_key]);
       label.textContent = data[i][labels_key];
       div.appendChild(label);
       div.appendChild(document.createElement("br"));
   }

};

window.addEventListener("load", function() {
    var ip = self.location.host
//  var ip = "127.0.0.1"
    var webSocketString = "ws://" + ip + "/ws0";
    var searchSocket = new WebSocket(webSocketString);

    nameField.addEventListener('input', function (e) {
        input_text = nameField.value;
        json_text = "{\"type\":0, \"data\":\"" + input_text + "\"}";
        sendToServer(searchSocket, json_text, output);
        e.preventDefault();
    })

    var registerButtonDiv = document.createElement("div");
    registerButtonDiv.id = "registerCustomer";
    registerButtonDiv.className = "button";
    registerButtonDiv.innerHTML = "&nbspAdd Customer&nbsp";
    registerButtonDiv.addEventListener('click', function (e) {
        clearList(output);
        clearList(nameList);
        searchDiv.removeChild(registerButtonDiv);
        var firstNameField = document.createElement("input");
        firstNameField.id = "firstNameField";
        firstNameField.className = "nameField";
        firstNameField.type = "text";
        firstNameField.placeholder = "First Name";
        var lastNameField = document.createElement("input");
        lastNameField.id = "lastNameField";
        lastNameField.className = "nameField";
        lastNameField.type = "text";
        lastNameField.placeholder = "Last Name";
        lastNameField.value = nameField.value;
        var submitCust = document.createElement("div");
        submitCust.id = "cust_submit_button";
        submitCust.className = "button";
        submitCust.innerHTML = "&nbspSubmit&nbsp";
        submitCust.addEventListener('click', function (e) {
            if (firstNameField.value != "" && lastNameField.value != "") {
                submitCust.textContent = "GOOD";
                json_text = "{\"type\":3, \"data\":{\"last_name\":\""+lastNameField.value+"\",\"first_name\":\""+firstNameField.value+"\"}}";
                sendToServer(searchSocket, json_text, output);
        //After all said and done, put stuff back
                searchDiv.appendChild(nameField);
                searchDiv.appendChild(nameList);
                searchDiv.removeChild(firstNameField);
                searchDiv.removeChild(lastNameField);
                searchDiv.removeChild(submitCust);
                searchDiv.appendChild(registerButtonDiv);
                nameField.focus();
            }
            else {
                alert("Please enter a first and a last name");
            }
        });

       
        searchDiv.removeChild(nameField);
        searchDiv.removeChild(nameList);
        searchDiv.appendChild(firstNameField);
        searchDiv.appendChild(lastNameField);
        searchDiv.appendChild(submitCust);
        lastNameField.focus();
        
    });

    searchDiv.appendChild(registerButtonDiv);
    
    searchSocket.onmessage = function (event) {
        var json_data = JSON.parse(event.data);
        var myHeading = document.getElementById('heading');
        var heading = "Safai Bean Club";
        switch (json_data['type']) {
            case 0:
                nameField.focus();
                heading = "Safai Bean Club";
                myHeading.textContent = heading;
                data = json_data['data'];
                clearList(nameList);
                clearList(output);

                for (i = 0; i < data.length; i++) {
                    var li = document.createElement("li");
                    var last = data[i]['cust_last_name'];
                    last = last.charAt(0).toUpperCase() + last.substring(1);
                    var first = data[i]['cust_first_name'];
                    first = first.charAt(0).toUpperCase() + first.substring(1);
                    var text = last + ", " + first;
                    li.appendChild(document.createTextNode(text));
                    li.id = data[i]['cust_id'];
                    nameList.appendChild(li);
                }
                nameList.addEventListener('click', function (e){
                    if (e.target.id) {
                        json_text = "{\"type\":1, \"data\":" + e.target.id +"}";
                        sendToServer(searchSocket, json_text, output);
                    }
                });
                break;
            case 1:
                clearList(nameList);
                clearList(output);
                nameField.focus();

                var data = json_data['data']

                
                var last = data['cust_last_name'].charAt(0).toUpperCase() + data['cust_last_name'].substring(1);
                var first = data['cust_first_name'].charAt(0).toUpperCase() + data['cust_first_name'].substring(1);
                heading =  last + ", " + first;
                myHeading.textContent = heading;

                var custDiv = document.createElement("div");
                custDiv.id = "custData";
                purchases = data['custData'];
                if (purchases.length == 0) {
                    custDiv.appendChild(document.createTextNode("No Purchases"));
                }
                else {
                    html = "<table><thead><tr><th>Coffee Name</th><th>Grind</th>";
                    html += "<th>Weight</th><th>Transaction Date</th></tr></thead>";
                    html += "<tbody>";
                    for (i = 0; i < purchases.length; i++) {
                        html += "<tr>";
                        html += "<td>" + purchases[i]['coffee_name'] + "</td>";
                        html += "<td>" + purchases[i]['grind_desc'] + "</td>";
                        html += "<td>" + purchases[i]['purchase_weight'] + "oz</td>";
                        html += "<td>" + purchases[i]['purchase_date']+ "</td>";
                        html += "</tr>";
                    }
                    html += "</tbody></table>";
                    custDiv.innerHTML = html;
                }

                var addButtonDiv = document.createElement("div");
                addButtonDiv.id = "addPurchase";
                addButtonDiv.className = "button";
                addButtonDiv.innerHTML = "&nbspAdd Purchase&nbsp";
                addButtonDiv.addEventListener('click', function (e) {
//                  output.removeChild(addButtonDiv);
                    clearList(output);

                    var backButtonDiv = document.createElement("div");
                    backButtonDiv.id = "back";
                    backButtonDiv.className = "button";
                    backButtonDiv.innerHTML = "&nbspBack&nbsp";
                    backButtonDiv.addEventListener('click', function (e) {
                        json_text = "{\"type\":1, \"data\":" + data['custId'] +"}";
                        sendToServer(searchSocket, json_text, output);
                    });

                    var coffees = document.createElement("div");
                    coffees.id = "coffees";
                    var h2 = document.createElement("h2");
                    h2.textContent = "Coffee Type";
                    coffees.appendChild(h2);
                    createRadioList(coffees, data['coffeeData'], 'coffee', 'coffee_id', 'coffee_name');
                    output.appendChild(coffees);
            
                    var grinds = document.createElement("div");
                    grinds.id = "grinds";
                    h2 = document.createElement("h2")
                    h2.textContent = "Grind Type"
                    grinds.appendChild(h2);
                    createRadioList(grinds, data['grindData'], 'grind', 'grind_id', 'grind_desc');
                    output.appendChild(grinds);

                    var weightData = JSON.parse("[{\"weight_val\":16, \"weight_desc\":\"16oz\"},{\"weight_val\":12, \"weight_desc\":\"12oz\"},{\"weight_val\":8, \"weight_desc\":\"8oz\"}]");
                    var weights = document.createElement("div");
                    weights.id = "weights";
                    h2 = document.createElement("h2");
                    h2.textContent = "Weight";
                    weights.appendChild(h2);
                    createRadioList(weights, weightData, 'weight', 'weight_val', 'weight_desc');
                    output.appendChild(weights);

                    var submit = document.createElement("div");
                    submit.id = "submit_button";
                    submit.className = "button";
                    submit.innerHTML = "&nbspSubmit&nbsp";
                    submit.addEventListener('click', function (e) {
                        var sel_coffee = "";
                        var sel_grind = "";
                        var sel_weight = "";
                        if (document.querySelector('input[name="coffee"]:checked') &&  document.querySelector('input[name="grind"]:checked') &&  document.querySelector('input[name="weight"]:checked')) {
                            submit.textContent = "GOOD";
                            sel_coffee = document.querySelector('input[name="coffee"]:checked').value;
                            sel_grind = document.querySelector('input[name="grind"]:checked').value;
                            sel_weight = document.querySelector('input[name="weight"]:checked').value;

                            json_text = "{\"type\":2, \"data\":{\"cust_id\":"+data['custId']+", \"coffee_id\":"+sel_coffee+", \"grind_id\":"+sel_grind+", \"weight\":"+sel_weight+"}}"
                            sendToServer(searchSocket, json_text, output);
                        }
                        else {
                            alert("Please select all options <3");
                        }
                        
                    });

                    output.appendChild(submit);
                    output.appendChild(backButtonDiv);

                });

                var backButtonDiv = document.createElement("div");
                backButtonDiv.id = "back";
                backButtonDiv.className = "button";
                backButtonDiv.innerHTML = "&nbspBack&nbsp";
                backButtonDiv.addEventListener('click', function (e) {
                    input_text = nameField.value;
                    json_text = "{\"type\":0, \"data\":\"" + input_text + "\"}";
                    sendToServer(searchSocket, json_text, output);
                    e.preventDefault();
                });
                output.appendChild(addButtonDiv);
                output.appendChild(backButtonDiv);
                output.appendChild(custDiv);
                break;
            case -1:
                if (json_data['data'].length > 0) {
                    alert(json_data['data'][0]);
                }
                else {
                    alert("Server Error");
                }
                break;
            case -2:
                alert(json_data['data']);
                json_text = "{\"type\":1, \"data\":" + json_data['cust_id'] + "}";
                sendToServer(searchSocket, json_text, output);
                break;
        }
    };


});
