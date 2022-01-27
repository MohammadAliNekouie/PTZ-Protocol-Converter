/* 
this project writed for kankashco by M.A.N.
*/
var debug=1;
var sys = require('util');
var net = require('net');
var shell = require('shelljs');
var portastic=require('portastic');
var dgram = require('dgram');
var express = require('express');
var fs = require('fs');
var app = express();
var apps=[];
var client_UDP = dgram.createSocket('udp4');
var message_seq=1000;
var sync_seq=1;
var startup_seq=1;
var temp_seq=0;
var ready=false;
var array=[];   

var TCP_CONNECTION=[];// contain: ID , IP , CREATE_TIME , DSEQ , LSEQ , SOCKET , COMMAND ,TIMER , KILL
////////////structure of buffer UDP///////////////
// 01 + 0Y + XXXX + 00 + CC + 00 + AAAAAAAAAAAAAAAA + 00
// 01 is start byte
// 0Y is packet type 00 for request and 01 for responce
// XXXX is packet secquence number that start from 1 DEC
// 00 is end of header
// CC is COMMAND
// 00 is end of command and start of Arguments
// AAAAAAAAAAAAAAAA is 8byte argument for command
// 00 is end of argument section
/////////////////////////////////////////////////
//////////////////flow diagram///////////////////
//when start indigo and enter password this thing will happen
//SW send first UDP packet to 49300 with    type=req seq=1 com=01 arg=65 like message4
//SW wait for responce of UDP packet with   type=res seq=1 com=01 arg=65 + responce
//SW send next UDP packet to 49300 with     type=req seq=1 com=02 arg=10 like messageN
//SW wait for responce of UDP packet with   type=res seq=1 com=02 arg=10 + responce

//SW send next UDP packet to 49300 with     type=req seq=1 com=02 arg=10 like messageN
//SW wait for responce of UDP packet with   type=res seq=1 com=02 arg=10 + responce
//SW send next UDP packet to 49300 with     type=req seq=2 com=02 arg=62 like messageK
//SW wait for responce of UDP packet with   type=res seq=2 com=02 arg=62 + responce
//SW send next UDP packet to 49300 with     type=req seq=3 com=02 arg=63 like messageL
//SW wait for responce of UDP packet with   type=res seq=3 com=02 arg=63 + with no responce

//SW send next UDP packet to 49300 with     type=req seq=1 com=02 arg=10 like messageN
//SW wait for responce of UDP packet with   type=res seq=1 com=02 arg=10 + responce
//SW send next UDP packet to 49300 with     type=req seq=2 com=02 arg=62 like messageP
//SW wait for responce of UDP packet with   type=res seq=2 com=02 arg=62 + responce
//SW send next UDP packet to 49300 with     type=req seq=2 com=02 arg=63 like messageO
//SW wait for responce of UDP packet with   type=res seq=2 com=02 arg=63 + with no responce

//SW send next UDP packet to 49300 with     type=req seq=1 com=02 arg=10 like messageN
//SW wait for responce of UDP packet with   type=res seq=1 com=02 arg=10 + responce
//SW send next UDP packet to 49300 with     type=req seq=2 com=02 arg=62 like messageP
//SW wait for responce of UDP packet with   type=res seq=2 com=02 arg=62 + responce
//SW send next UDP packet to 49300 with     type=req seq=3 com=02 arg=63 like messageL
//SW wait for responce of UDP packet with   type=res seq=3 com=02 arg=63 + with no responce

//SW send next UDP packet to 49300 with     type=req seq=1 com=02 arg=10 like messageN
//SW wait for responce of UDP packet with   type=res seq=1 com=02 arg=10 + responce
//SW send next UDP packet to 49300 with     type=req seq=2 com=02 arg=62 like messageQ
//SW wait for responce of UDP packet with   type=res seq=2 com=02 arg=62 + responce
////////////////////////end of startup transmission///////////////////////////////
///////////////////////////per move transmission/////////////////////////////
//SW send first UDP packet to 49300 with    type=req seq=XXX com=54 arg=10 like message1
//SW wait for responce of UDP packet with   type=req seq=XXX com=54 arg=10 + responce
//SW send first UDP packet to 49300 with    type=req seq=XXX+1 com=02 arg=10 like message4
//SW wait for responce of UDP packet with   type=req seq=XXX+1 com=02 arg=10 + responce
//SW send first UDP packet to 49300 with    type=req seq=YYY com=54 arg=42 like message3
//SW wait for responce of UDP packet with   type=req seq=YYY com=54 arg=42 + responce
/////////////sync check every one minute send/////////////////////////
var message4 = new Buffer('01000001000100650000000000000000','hex');// has counter section in itself and it will update
var message5 = new Buffer('0100000e000100650000000000000000','hex');// every 1 minute and has fix "e" character in data.
var messageA = new Buffer('0100000f000100650000000000000000','hex');// i think this is lost and sequnce check request
var messageB = new Buffer('01000010000100650000000000000000','hex');// even when no stream performed this UDP packet will sent
var messageC = new Buffer('01000011000100650000000000000000','hex');
var messageD = new Buffer('01000012000100650000000000000000','hex');
var messageE = new Buffer('01000013000100650000000000000000','hex');
var messageF = new Buffer('01000014000100650000000000000000','hex');
////////////////////////////////////////////////////////////////////
/////////////////////////SAMPLES////////////////////////////////////
var message1 = new Buffer('0100af0d005400100000000000000000','hex');//1  
var message6 = new Buffer('0100af0f005400100000000000000000','hex');//3
var message0 = new Buffer('0100af11005400100000000000000000','hex');//5
var messageM = new Buffer('0100af13005400100000000000000000','hex');//4

var message8 = new Buffer('01000001000200100000000000000000','hex');//2
var message9 = new Buffer('0100af10000200100000000000000000','hex');//4
var message2 = new Buffer('0100af14000200100000000000000000','hex');//6
var message7 = new Buffer('0100e37a000200100000000000000000','hex');//4

var message3 = new Buffer('01009b8f0054004200000000000000240001000061646d696e6973747261746f7200000000000000000000000000000000000000','hex');
var messageI = new Buffer('01008f380054004200000000000000240001000061646d696e6973747261746f7200000000000000000000000000000000000000','hex');
var messageJ = new Buffer('0100604e0054004200000000000000240001000061646d696e6973747261746f7200000000000000000000000000000000000000','hex');
var messageG = new Buffer('0100ce840054004200000000000000240001000061646d696e6973747261746f7200000000000000000000000000000000000000','hex');

// user message
var messageH = new Buffer('010000020002006200000000000000248a74e9ba0000000200000001000000020000000000000000000000020000000300000000','hex');
var messageK = new Buffer('01000002000200620000000000000024eff16b980000000200000001000000020000000000000000000000020000000300000000','hex');
var messageP = new Buffer('01000002000200620000000000000024fe0a12360000000200000001000000020000000000000000000000020000000300000000','hex');
var messageQ = new Buffer('01000002000200620000000000000024d27a21b90000000200000001000000020000000000000000000000020000000300000000','hex');

var messageL = new Buffer('0100000300020063000000000000000482e60001','hex');
var messageN = new Buffer('01000001000200100000000000000000','hex');
var messageO = new Buffer('0100000200020063000000000000000400000000','hex');

var HOST= '172.24.4.50';
var PORT_TCP = 49504;
var PORT_UDP = 49300;
var IDEL_DELAY = 5;   // after 5sec TCP connection will be expire you must reset it by send UDP credential.
var LOOK_DELAY = 60; // after 60sec system check the client by send a sync udp packet
var KILL_TIMEOUT = 3;  // after 3+1 cycle of sending stop command connection will be terminated

var command='AD01;GCF:202136B:2022510'+String.fromCharCode(3)+String.fromCharCode(2)+'AD01;GC7:2021224';

//////////////////////////////////////////////////////////////////////////////////
console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
load_configs();


////////////////////////////load config files////////////////////////////////////
function load_configs()
{
    var value="config.cfg";
    var file = fs.readFileSync(value, "utf8");
    var json_file=[];
    json_file=JSON.parse(file);
    //console.log(json_file);
    
    
    
    json_file.CLIENT.forEach(function(client){
        var temp=express();
        temp.get('/', function(req, res){
            res.send('<H2 style="width:100%;background-color:black;color:white;padding:5px;">Protocol Command Center </H2><H3>Camera: '+client.NAME +' With Protocol: '+client.PROTOCOL+' is ONLINE on this port</H3><H4>writen by Mohammad Ali Nekouie </H4><H4> support : +98 9371323672</H4>');
        });

        temp.get('/ptz.cgi', function(req, res){
            res.send('reply');
            console.log('CAM name: '+client.NAME+' Port: '+client.HTTP_LISTEN_PORT+' Protocol: '+client.PROTOCOL+' Ptz Num: ' + req.query.PTZNumber);
            genetec_command_process(client.ID,req.query,client.PROTOCOL,client.IP);
        });

        temp.listen(client.HTTP_LISTEN_PORT);
        
        apps.push(temp);
        
       console.log("Camera "+client.NAME +" Listening For Genetec server command on PORT: "+client.HTTP_LISTEN_PORT); 

    });
    
}
////////////////////////Terminate connection////////////////////////////////////
function my_exec(cmd,callback)
{
    var exec = require('child_process').exec;    
    exec(cmd,function(err,stdout,stderr){
        callback(err,stdout,stderr);
    });
}


function close_port(ip,port,out)
{
    //my_exec("hstart64.exe wkillcx.exe "+ip+":" + port,out);
    my_exec("cports.exe /close * * "+ip+" " + port,out);
    //my_exec("ping 192.168.1.1",out);
    //shell.exec("wkillcx.exe "+ip+":" + port,function(code,output){
    //    out=output;
    //    shell.echo(output);
    //});
}


////////////////////////////////////////////////////////////////////////////////
function run_command(id,com,pan,tilt,zoom,focus,iris,protocol,ip)
{
    //console.log(id+'\n'+ip+'\n'+com+'\n'+pan+'\n'+tilt+'\n'+zoom+'\n');
    var dir='';
    var real_pan=1;
    var real_tilt=1;
    var temp_message;
    if(com!='null')
    {
        if(pan!=0 || tilt!=0 || zoom!=0 ||  iris!=0 || focus!=0 || com!='autofocus' || com!='autoiris')
        {
            if(com=='move')
            {
                if(pan<0){com='left';dir='8';}
                else if(pan>0){com='right';dir='C';}
                else if(tilt>0){com='top';dir='A';}
                else if(tilt<0){com='down';dir='E';}
                else if(zoom>0){com='zoomin';}
                else if(zoom<0){com='zoomout';}
                else if(iris>0){com='irisopen';}
                else if(iris<0){com='irisclose';}
                else if(focus<0){com='focusfar';}
                else if(focus>0){com='focusnear';}
                
                if(pan>0 && tilt>0){com='top-right';dir='B';}
                if(pan<0 && tilt>0){com='top-left';dir='9';}
                if(pan>0 && tilt<0){com='down-right';dir='D';}
                if(pan<0 && tilt<0){com='down-left';dir='F';}
                
                if(pan==0 && tilt==0 && zoom==0){com='stop';}
            }
            
            
            if(protocol=="panasonic")
            {
                
                real_pan=dec2hex(Math.round(Math.abs((pan/100)*15))).substr(3,1);
                real_tilt=dec2hex(Math.round(Math.abs((tilt/100)*15))).substr(3,1);
                //console.log(dir);
                //console.log(real_pan);
                //console.log(real_tilt);
                //console.log(com);
                if(com=='left' || com=='right' || com=='top' || com=='down' ||com=='top-right' || com=='top-left' || com=='down-right' || com=='down-left' )
                {    
                        command='GCF:9028'+dir+real_pan+real_tilt+String.fromCharCode(3);
                }
                else
                {
                    switch(com)
                    {                                                             
                    case 'zoomin': 
                        command='GCF:9022100'+String.fromCharCode(3);
                        break;
                    case 'zoomout': 
                        command='GCF:9026100'+String.fromCharCode(3);
                        break;
                    case 'focusnear': 
                        command='GC7:9034002'+String.fromCharCode(3);
                        break;
                    case 'focusfar': 
                        command='GC7:9034006'+String.fromCharCode(3);
                        break;        
                    case 'irisopen': 
                        command='GC7:0021002'+String.fromCharCode(3);
                        break;        
                    case 'irisclose': 
                        command='GC7:0021003'+String.fromCharCode(3);
                        break;                
                    case 'autofocus': 
                        command='GC7:0021A06'+String.fromCharCode(3);
                        break;        
                    case 'autoiris': 
                        command='GC7:0021005'+String.fromCharCode(3);
                        break;     
                    case 'stop': 
                        command='GCF:9028100'+String.fromCharCode(3);
                        break;                     
                    }
                } 
            }
            else if(protocol=='pelco_p')
            {
                var data1=0;
                var data2=0;
                var data3=0;
                var data4=0;
                var check_sum=0;
                
                if(pan>0){data2=data2 | 0x02;}
                if(pan<0){data2=data2 | 0x04;}
                if(tilt>0){data2=data2 | 0x08;}
                if(tilt<0){data2=data2 | 0x10;}  
                if(zoom>0){data2=data2 | 0x20;}
                if(zoom<0){data2=data2 | 0x40;} 

                if(focus<0){data1=data1 | 0x01;}
                if(focus>0){data1=data1 | 0x02;} 
                if(iris>0){data1=data1 | 0x04;}
                if(iris<0){data1=data1 | 0x08;} 
                
                if(com=='autofocus' || com=='autoiris'){data1=data1 || 0x20;} // Auto SCAN mode
                
                if(com!='stop')
                {
                    real_pan=dec2hex(Math.round(Math.abs((pan/64)*15))).substr(2,2);
                    real_tilt=dec2hex(Math.round(Math.abs((tilt/64)*15))).substr(2,2);

                    temp_message='A000'+dec2hex(data1).substr(2,2)+dec2hex(data2).substr(2,2)+real_pan+real_tilt+'AF';

                    // XOR check sum calculator
                    for(var temp=0;temp<temp_message.length;temp=temp+2)
                    {
                        check_sum=check_sum^parseInt(parseInt('0x'+temp_message.substr(temp,2)),10);
                        //console.log(parseInt(parseInt('0x'+temp_message.substr(temp,2)),10));
                    }
                    command=temp_message+dec2hex(check_sum).substr(2,2);
                    command.toUpperCase();
                    command=hex2a(command);
                }
                else
                {
                    command='A00000000000AF0F';
                    command=hex2a(command);
                }
            }
            
            request_to_send_on_tcp(ip,id,command,com);
            
            //enable this just for debuging
            console.log('Command: '+com+" Result: "+command);
        }
    }
}
//////////////////////////////////////HTTP SECTION///////////////////////////////////
/*
app.get('/', function(req, res){
    res.send('<H3>This is a Protocol center writen by Mohammad Ali Nekouie call for support : +98 9371323672</H3>');
});

app.get('/ptz.cgi', function(req, res){
    res.send('reply');
    console.log('Ptz Number is: ' + req.query.PTZNumber);
    genetec_command_process(req.query);
});

app.listen(80);

*/
function genetec_command_process(id,get_obj,protocol,ip)
{
    
    // in Genetec Protocol all command sent in a HTTP GET request 
    // just Two command will send , one at start of motion and one at the end
    // system think until tcp connection established or end command not received
    // it must continue to send move command to the target.
    //HTTP request is like below
    //   url/ptz.cgi?PTZNumber=1&PanSpeed=0&TiltSpeed=0&ZoomSpeed=0
    
    var pan=0;
    var tilt=0;
    var zoom=0;
    var focus=0;
    var iris=0;
        var commands='null';
    if(typeof get_obj.PTZNumber !== 'undefined' && get_obj.PTZNumber!==null)
    {
        commands='move';
        if(typeof get_obj.PanSpeed !== 'undefined' && get_obj.PanSpeed!==null)
        {
            pan=parseInt(get_obj.PanSpeed);
        }
        if(typeof get_obj.TiltSpeed !== 'undefined' && get_obj.TiltSpeed!==null)
        {
            tilt=parseInt(get_obj.TiltSpeed);
        }
        if(typeof get_obj.ZoomSpeed !== 'undefined' && get_obj.ZoomSpeed!==null)
        {
            zoom=parseInt(get_obj.ZoomSpeed);
        }
        if(typeof get_obj.FocusSpeed !== 'undefined' && get_obj.FocusSpeed!==null)
        {
            focus=parseInt(get_obj.FocusSpeed);
        }
        if(typeof get_obj.IrisSpeed !== 'undefined' && get_obj.IrisSpeed!==null)
        {
            iris=parseInt(get_obj.IrisSpeed);
        }
        if(typeof get_obj.Flip !== 'undefined' && get_obj.Flip!==null)
        {
            commands='autoiris';            
        }
        if(typeof get_obj.GoHome !== 'undefined' && get_obj.GoHome!==null)
        {            
            commands='autofocus';
        }
        console.log(commands+'(Pan:'+pan+' Tilt:'+tilt+' Zoom:'+zoom+' Iris:'+iris+' Focus:'+focus+')');
        
        run_command(id,commands,pan,tilt,zoom,focus,iris,protocol,ip);
    }
    else
    {
        console.log('invalid get url');
    }
}



//////////////////////////////////TCP SECTION////////////////////////////////////////


function send_tcp_command(index,socket,callback)
{
        var uni1=String.fromCharCode(2);        
        var text=uni1+TCP_CONNECTION[index].COMMAND;//+'\003';        
        //var text=command;        
        socket.write(text,function()
        {
                callback(socket);            
        });        
}

function send_tcp_stop_command(socket,protocol,callback)
{
        var uni1=String.fromCharCode(2);  
        if(protocol=='panasonic')
        {
            var text=uni1+'GCF:9028100'+String.fromCharCode(3);     
        }
        else
        {
            var text=uni1+hex2a('A00000000000AF0F')+String.fromCharCode(3);    
        }
        //var text=command;        
        socket.write(text,function()
        {
                callback(socket);            
        });        
}


function open_tcp_connection(ip,callback)
{
    var client_TCP;
    client_TCP = new net.Socket({allowHalfOpen: false, timeout:0});     
    client_TCP.setKeepAlive(false);
    client_TCP.connect(PORT_TCP, ip, function() {
        callback(client_TCP);
        console.log('OPEN TCP TO: ' + ip + ':' + PORT_TCP);
    });
    
   client_TCP.on('error', function (exc) {
        if(debug==2){console.log("ignoring exception: " + exc);}
    });
}

/////////////////////////////////////////UDP SECTION//////////////////////////////////////////
function check_and_update_connection_status(id)
{
    var current_sec=Get_Time_Sec();    

    for(var i=0;i<TCP_CONNECTION.length;i++)
    {
        if(TCP_CONNECTION[i]!==null)
        {
            if(TCP_CONNECTION[i].ID!==null)
            {
                if(TCP_CONNECTION[i].ID==id)
                {
                    if((TCP_CONNECTION[i].CREATE_TIME+IDEL_DELAY)<current_sec)
                    {
                        //connection expired then delete array memory
                        TCP_CONNECTION.splice(i,1);
                        return null;
                    }
                    else
                    {
                        // resume The connection and update CREATE_TIME
                        TCP_CONNECTION[i].CREATE_TIME=current_sec;
                        return i;
                    }
                } 
            }
            else
            {
                console.log('BAD ID');
            }            
        }
        else
        {
            console.log('BAD STRUCT');
        }
    }
}

function find_connection_by_ip(ip)
{  
    for(var i=0;i<TCP_CONNECTION.length;i++)
    {
        if(TCP_CONNECTION[i]!==null)
        {
            if(TCP_CONNECTION[i].IP!==null)
            {
                if(TCP_CONNECTION[i].IP==ip)
                {
                   return i;                   
                } 
            }
        }
    }
    return null;
}

function request_to_send_on_tcp(ip,id,command,command_type)
{
    var result=check_and_update_connection_status(id);
    var temp_message='';
    if(result==null)// create new connetion and push it into TCP_CONNECTION array
    {
        /*
        temp_message='0100'+dec2hex(message_seq[id])+'005400100000000000000000';
        message_seq[id]++;
        temp_message=new Buffer(temp_message,'hex');
        
        */
       //
       
       //create array stucture for new connection
       //ID , IP , CREATE_TIME , DSEQ , LSEQ , SOCKET , COMMAND ,TIMER , KILL,UDP_STATUS,UDP_SEQ
       var DSEQ=parseInt(Math.random(65535),10);//short Idel delay seq
       var LSEQ=parseInt(Math.random(65535),10);//long delay seq
       TCP_CONNECTION.push({"ID":id,"IP":ip,"CREATE_TIME":Get_Time_Sec(),"UDP_SEQ":1,"UDP_STATUS":0,"DSEQ":DSEQ,"LSEQ":LSEQ,"SOCKET":null,"COMMAND":null,"TIMER":null,"KILL":null});
       var temp=check_and_update_connection_status(id);
       //send UDP request to establesh a TCP connection
       if(temp!==null)
       {
            temp_message='0100'+dec2hex(DSEQ).substr(0,4)+'005400100000000000000000';
            DSEQ+1;
            if(DSEQ>65535){DSEQ=0;}
            send_udp_on_random_port(temp,ip,temp_message,function(){

                if(temp!==null && TCP_CONNECTION[temp]!==null)
                {
                     TCP_CONNECTION[temp].DSEQ=DSEQ;
                     TCP_CONNECTION[temp].UDP_SEQ=2;
                     //process_UDP(temp);
                }
            });    
        }
        else
        {
            console.log('ERROR in TCP Connection Array')
        }
    }
    else // result have value of index of last estableshed connection just continue it no need to update seq or send credential!
    {
        var socket=TCP_CONNECTION[result].SOCKET;//var socket=find_socket_by_sequence(responce.seq);
        if(socket!==null && socket!==false)
        {
            TCP_CONNECTION[result].COMMAND=command;
            if(TCP_CONNECTION[result].KILL==null)
            {
                send_tcp_command(result,socket,function(){
                    //active 1 Sec Timer To send this movement until the stop command come.
                    if(command_type=='stop'){TCP_CONNECTION[result].KILL=KILL_TIMEOUT}

                    if(TCP_CONNECTION[result].TIMER!==null)
                    { // stop timer if it already exist
                        clearInterval(TCP_CONNECTION[result].TIMER);
                    }
                    // one sec timer interval for repeat sending last message until stop come
                    var timer_id=setInterval(function(){
                        if(TCP_CONNECTION[result].KILL!=null)
                        {
                            TCP_CONNECTION[result].KILL-=1;
                            if(TCP_CONNECTION[result].KILL<=0)//check timeout is over?
                            {
                                // clear timer
                                clearInterval(TCP_CONNECTION[result].TIMER);
                                // clear array
                                TCP_CONNECTION.splice(result,1);
                                // close port
                                close_port(ip,PORT_TCP,function(err,stdout,stderr){console.log(err);});
                            }
                        }
                        send_tcp_command(result,socket,function(){});
                    },1000);
                    TCP_CONNECTION[result].TIMER=timer_id;
                });
            }
        }
        temp_seq=0;
    }     
}


client_UDP.on('listening', function () {
    var address = client_UDP.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

client_UDP.on('message', function (message, remote) {
    //console.log(message.toString('hex').substr(0,28));
    var result=UDP_Data_analyser(message);
    if(debug==2){console.log('packet from: '+remote.address + ':' + remote.port +' - ' + result.type+' - seq: '+result.seq+' - command: '+result.command+' - arg: '+result.arg_firstbyte);}
    
    if(remote.port==PORT_UDP)
    {
        //client_UDP.close(function(){
            var index=find_connection_by_ip(remote.address);
            if(index!==null)
            {
                startup_transmission(index,remote.address,TCP_CONNECTION[index].UDP_STATUS,result); 
            }
        //});
    }
});


client_UDP.on("error", function (err) {
  //console.log("server error:\n" + err.stack);
  client_UDP.close();
});

client_UDP.bind(function(){
    // do UDP startup initial process for all client 
    
    TCP_CONNECTION.forEach(function(client,index){
        startup_transmission(index,client.IP,client.UDP_STATUS,null); 
    });
    
});

function UDP_Data_analyser(data)
{
    if(data!='' && data!=null && data.length>14)
    {
        var data_hex=data.toString('hex').substr(0,28);
        if(data_hex.substr(0,2)=='01')//check start byte
        {
            var type='req'
            if(data_hex.substr(2,2)=='01')
            {
                type='res';
            }
            
            var seq=parseInt(data_hex.substr(4,4),16);
            var command=data_hex.substr(10,2);
            var arg_firstbyte=data_hex.substr(14,2);
            
            return {
                type: type,
                seq: seq,
                command: command,
                arg_firstbyte: arg_firstbyte
            };
        }
    }
    return false;
}

function startup_transmission(index,ip,sequence,responce){
   // console.log(sequence);
    if(sequence==1 && responce==null)
    {
        send_udp_on_random_port(index,ip,message4,function(){startup_seq++;});      
    }
    else
    {
        if(responce.type=='res')
        {
            if(sequence==2)
            {
                send_udp_on_random_port(index,ip,messageN,function(){startup_seq++;});   
            }
            else if(sequence==3)
            {
                send_udp_on_random_port(index,ip,messageN,function(){startup_seq++;});
            }
            else if(sequence==4)
            {
                send_udp_on_random_port(index,ip,messageK,function(){startup_seq++;});
            }
            else if(sequence==5)
            {
                send_udp_on_random_port(index,ip,messageL,function(){startup_seq++;});
            }  
            else if(sequence==6)
            {
                send_udp_on_random_port(index,ip,messageN,function(){startup_seq++;});
            }
            else if(sequence==7)
            {
                send_udp_on_random_port(index,ip,messageP,function(){startup_seq++;});
            }
            else if(sequence==8)
            {
                send_udp_on_random_port(index,ip,messageO,function(){startup_seq++;});
            }      
            else if(sequence==9)
            {
                send_udp_on_random_port(index,ip,messageN,function(){startup_seq++;});
            }
            else if(sequence==10)
            {
                send_udp_on_random_port(index,ip,messageP,function(){startup_seq++;});
            }
            else if(sequence==11)
            {
                send_udp_on_random_port(index,ip,messageL,function(){startup_seq++;});
            }     
            else if(sequence==12)
            {
                send_udp_on_random_port(index,ip,messageN,function(){startup_seq++;});
            }
            else if(sequence==13)
            {
                send_udp_on_random_port(index,ip,messageQ,function(){startup_seq++;});
                // run one minute timer now
                TCP_CONNECTION[index].DSEQ++;//message_seq++;
                ///////////////////////////////ready=true;////////////////////////////////
                setInterval(function(){
                    var temp_message='0100'+dec2hex(TCP_CONNECTION[index].LSEQ)+'000100650000000000000000';
                    temp_message=new Buffer(temp_message,'hex');
                    //console.log(temp_message)
                    send_udp_on_random_port(index,ip,temp_message,function(){
                        TCP_CONNECTION[index].LSEQ+=3;
                        if(TCP_CONNECTION[index].LSEQ>65535)
                        {
                            TCP_CONNECTION[index].LSEQ=0;
                        }});
                },LOCK_DELAY*1000);
            }    
            else
            {
                //movement
                //do first one every time you want - just delete it from here and put it anywhere
                
                //if(temp_seq==1) // this will send at first UDP request command then not neccessary to run it
                //{
                //    var temp_message='0100'+dec2hex(TCP_CONNECTION[index].DSEQ)+'005400100000000000000000';
                //    send_udp_on_random_port(temp_message,function(){temp_seq++;});
                //}                
                if(TCP_CONNECTION[index].UDP_SEQ==2)
                {
                    var temp_message='0100'+dec2hex(TCP_CONNECTION[index].DSEQ)+'000200100000000000000000';
                    temp_message=new Buffer(temp_message,'hex');
                    send_udp_on_random_port(index,ip,temp_message,function(){TCP_CONNECTION[index].UDP_SEQ++;});
                }
                else if(TCP_CONNECTION[index].UDP_SEQ==3)
                {     
                    open_tcp_connection(function(socket){
                        //var next_seq=new_seq(TCP_CONNECTION[index].DSEQ);
                        TCP_CONNECTION[index].DSEQ++;
                        var next_seq=TCP_CONNECTION[index].DSEQ;
                        var temp_message='0100'+dec2hex(next_seq)+'0054004200000000000000240001000061646d696e6973747261746f7200000000000000000000000000000000000000';
                        temp_message=new Buffer(temp_message,'hex');
                        send_udp_on_random_port(index,ip,temp_message,function(){
                            TCP_CONNECTION[index].UDP_SEQ++;
                            send_tcp_command(index,socket,function(){});
                            var obj={seq:next_seq,socket:socket};
                            array.push(obj);
                        });
                    });
                }
                else if(TCP_CONNECTION[index].UDP_SEQ==4)
                {
                    var socket=TCP_CONNECTION[index].SOCKET;//find_socket_by_sequence(responce.seq);
                    if(socket!=null && socket!=false)
                    {
                        send_tcp_command(index,socket,function(){
                            //send_tcp_stop_command(socket,function(socket){     
                            //socket.destroy();
                            //    close_port(ip,PORT_TCP,function(err,stdout,stderr){console.log(err);});
                            //    if(debug==2){console.log('end of a sockets');}
                            //});                        
                        });
                    }
                    TCP_CONNECTION[index].UDP_SEQ=0;
                }
                
            }
        }
    }

}

function new_seq(seq)
{
    var new_one=Math.floor(Math.random()* seq);
    //console.log(new_one);
    //while(new_one>10000){new_one=new_one-10000;}
    return new_one;
}

function find_socket_by_sequence(seq)
{
    for(i=0;i<array.length;i++)
    {
        if(array[i].seq==seq)
        {
            return array[i].socket;
        }
    }
    return false;
}


function send_udp_on_random_port(index,ip,message,callback)
{
        //portastic.find({
        //    min:58250,
        //     max:58260
        //}).then(function(ports){
        //    var rnd=Math.floor(Math.random()* ports.length);
                
            //console.log(index+"-"+ip+"-"+message);
            
        //    client_UDP.bind(ports[rnd],function(){
            //client_UDP.bind(function(){
                client_UDP.send(message, 0, message.length, PORT_UDP, ip, function(err, bytes) {
                    if (err) throw err; 
                    callback();
                });    
            //});           
        //});  
}

function dec2hex(i)
{
  var result = "0000";
  if      (i >= 0    && i <= 15)    { result = "000" + i.toString(16); }
  else if (i >= 16   && i <= 255)   { result = "00"  + i.toString(16); }
  else if (i >= 256  && i <= 4095)  { result = "0"   + i.toString(16); }
  else if (i >= 4096 && i <= 65535) { result =         i.toString(16); }
  return result;
}

function hexval(c)
{
    if ('0' <= c && c <= '9')
        return c - '0';
    else if ('a' <= c && c <= 'f')
        return c - 'a' + 10;
    else if ('A' <= c && c <= 'F')
        return c - 'A' + 10;
    else abort();
}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function a2hex(str) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i ++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push(hex);
  }
  return arr.join('');
}

function Get_Time_Sec()
{
    var d = new Date();
    var n = d.getTime();
    return parseInt(n/1000,10);
}




