var site = "http://site1840.tw.cs.unibo.it/";
var starter_list;
var search_list;
var cronology = new Array();
var timer;
var player;
var added=false;
var counter=0;
var recommender='Starter';
var global_pop = new Array();
var global_relative = new Array();
var h_state = false;
var artist = "";
var track = "";
var titleParsed = "";
var titleParsed_weak = "";
var genre = "";

var popRelLoc = new Array();


function navHandler(){
	h_state = true;
	if(history.state)	loadvideo(history.state);
}

window.addEventListener("popstate", navHandler, false);

function setRec(rec){
	recommender=rec;
}

function onYouTubePlayerAPIReady(){
	player = new YT.Player('iframe', {
                events: {
                        'onStateChange': onPlayerStateChange
                }
        });
}

function deleteHistory(){
	localStorage.setItem('watching', 'ubUdtowLIZo');
	localStorage.removeItem('cronology');
	cronology = [];
	printCronology(cronology, '#rec');
}

function onPlayerStateChange(event){
	if (event.data==1){
		timer = setInterval(function(){

			if(player.getCurrentTime()>=15) {
				if(counter==0){
					//add to cronology
				if((cronology)&&(cronology.length>0)){
					if(cronology[0].videoId != localStorage.getItem('watching')){
						var idPred = cronology[0].videoId;
						var idSucc = localStorage.getItem('watching');
						$.get(site+"addRelative/"+idPred+"/"+idSucc+"/"+recommender, function(data){
                                        		console.log(data);
						});
					}
				}
					addToCronology(localStorage.getItem('watching'));
					printCronology(cronology, '#rec');
				}
				counter++;
			}
		}, 1000);
	}
}
		
function isInCronology(v){
	for (var i=0; i<cronology.length; i++){
		if (v.videoId==cronology[i].videoId){
			cronology.splice(i,1);
			cronology.unshift(v);
			return true;
			}
		}
		return false;
}
		
function addToCronology(video){
			var date = new Date();
			var gmtdate = date.toGMTString();
			var object = {
				"videoId": video,
				"timesWatched": 1,
				"prevalentReason": recommender,
				"lastSelected": gmtdate
			}
			 /* Managing local cronology*/
			if(!localStorage.getItem('cronology'))
				cronology=[];
                        if(!isInCronology(object)){
                                if (cronology.length==20) var a = cronology.pop();
                        	cronology.unshift(object);
			}
			localStorage.setItem('cronology', JSON.stringify(cronology));
			//Add to server cronology
			$.get(site+"localPop/"+object.videoId+"/"+object.timesWatched+"/"+object.prevalentReason+"/"+object.lastSelected, function(data){
				printCronology(data, '#LPA');
			});
		}

function loadvideo(video){
	var foundRelative = false;
	if(localStorage.getItem('cronology')){
		cronology = JSON.parse(localStorage.getItem('cronology'));
		printCronology(cronology, '#rec');
	}
	$.when (
		localStorage.setItem('watching', video),
		counter=0,
		player.loadVideoById(localStorage.getItem('watching')) ).then(function(){
			$.get(site+"getRelatives/"+localStorage.getItem('watching'), function(data){
				for(i in data){
                                	if(localStorage.getItem('watching')==data[i].id){
                                	        foundRelative = true;
                                        	printCronology(data[i].succ, '#LPR');
                                	}
                        	}       
                        	if(!foundRelative) 
                                	$('#LPR').html('No videos was found');
			});
		});
	if(!h_state)    history.pushState(localStorage.getItem('watching'), "");

	genre="";
	artist = "";
	track = "";
	titleParsed = "";
	titleParsed_weak = "";

	$.get(site+"listvideos/"+video, function(data){
		$("#titVid").html('<h4 id="titVid" class="card-title">'+data.items[0].snippet.title+'</h4>');			//VIDEO TITLE
		$("#descVid").html('<p id="descVid" class="card-text">'+data.items[0].snippet.description+'</p>');		//VIDEO DESC 
		$('#commVid').html('Attendere il caricamento...');		//WAIT FOR COMMENTS...
		$('#info').html('Attendere il caricamento...');
		puliziaTitolo(data.items[0].snippet.title);
		search_wiki(data.items[0].snippet.title);	
	});
			
	$.get(site+"getcomments/"+localStorage.getItem('watching'), function(data){      		//ASK SERVER FOR COMMENTS TO watching VIDEO
        	$('#commVid').html('');
            	for (i in data){
            		$('#commVid').append('<p><b>' + data[i].snippet.topLevelComment.snippet.authorDisplayName + '</b><br><br>' + data[i].snippet.topLevelComment.snippet.textDisplay + '</p><hr>');
            	}
	});

	related();
	fvitali();
	h_state = false;
	if(recommender == 'Global Relative')	globalRelative();
	
	$.when(artistSimilarity(), genreFind() ).then(function(){ $.get(site+"getstat/"+localStorage.getItem('watching'),function(data){                
        	$('#info').html('<p>'+'VIEW: '+ data.statistics.viewCount  + '</p>' + '<p>' + 'LIKE: ' + data.statistics.likeCount  + '</p>' + '<p>' + 'DISLIKE: ' + data.statistics.dislikeCount + '</p>' + '<p>' + 'ARTIST: ' + artist + '</p>' + '<p>' + 'GENRE: '+ genre + '</p>'+'<p>'+'TRACK: '+ track + '</p>');
			});
		});
}		
		


		function printVideos(j, section){  
			var i;
			var api = "'";			
			$("#"+section).html('<div class="container">');
			for(i=0; i<j.length; i++){
  				$.get(site+"listvideos/"+j[i].videoID, function(data){
                        	$("#"+section).append('<div class="row my-1">'+'<div class="col-sm-4" onclick="loadvideo('+ api +data.items[0].id + api+ ')">'+
                                                         '<img class="img-fluid" src=" '+data.items[0].snippet.thumbnails.medium.url +'">'+
                                	                 '</div>'+
                                         		 '<div class="col-md-8">'  +
						  	'<p>'+data.items[0].snippet.title+'</p>' + '</div>'+'</div>');
			}); 
			}
			$("#"+section).append('</div>');
		}

function starter(){
	if(localStorage.getItem('watching'))
		loadvideo(localStorage.getItem('watching'));
	else	
		loadvideo('ubUdtowLIZo');			
	$.get(site+"localPop/default/1/starter/date", function(data){
		printCronology(data,'#LPA');
        });

	jQuery.ajax({
		type: "GET",
		url: "http://site1825.tw.cs.unibo.it/video.json",
		dataType: "json",
		success: function(res){
			starter_list=res;
			printVideos(starter_list, 'start');
		},
		error: function(){
			console.log('error');}
		});
}

		function starterList(){
			printVideos(starter_list, 'starter');
		}
	
		function fvitali(){
			var url= "http://site1825.tw.cs.unibo.it/TW/globpop?id="+localStorage.getItem('watching');
			jQuery.ajax({
				type: "GET",
				url: url,
				dataType: "json",
				success: function(res){
					printVideos(res.recommended, 'fv');
				},
				error: function(){
					console.log('error');}
				});
		}
	
		function printSearch(list, section){
			var i=0;
                        var api = "'";
                        $("#"+section).html('<div class="container">');
                        for(i in list){
                                $("#"+section).append('<div class="row my-1">'+'<div class="col-sm-4" onclick="loadvideo('+ api +list[i].id.videoId + api+ ')">'+'<img class="img-fluid" src=" '+ list[i].snippet.thumbnails.medium.url +'">'+'</div>'+
                                                         '<div class="col-md-8">'  +
                                                        '<p>'+list[i].snippet.title+'</p>' + '</div>'+'</div>');
                        }
                        $("#"+section).append('</div>');
                        i=0;

		}
		
		function searchVideos(q, section){
			if(!section) section='search';
			if(q){
					jQuery.ajax({
                                	type: "GET",
                                	url: site+"ytsearch/"+q,
                                	dataType: "json",
                                	success: function(res){
						search_list=res;
						printSearch(search_list, section);
                                	},
                               		 error: function(){
                                        	console.log('error');}
                               	 	});
			}
		}

		function printCronology(items, section){
                        var api = "'";
                        $(section).html('<div class="container">');
			jQuery.ajaxSetup({async:false});
			for(i=0; i<items.length; i++){
                                $.get(site+"listvideos/"+items[i].videoId, function(data){
                                $(section).append('<div class="row my-1">'+'<div class="col-sm-4" onclick="loadvideo('+ api +data.items[0].id + api+ ')">'+
                                                         '<img class="img-fluid" src=" '+data.items[0].snippet.thumbnails.medium.url +'">'+
                                                         '</div>'+
                                                         '<div class="col-md-8">'  +
                                                        '<p>'+data.items[0].snippet.title+'</p>' + '</div>'+'</div>');
                        });
                        }
                        $(section).append('</div>');
			jQuery.ajaxSetup({async:true});
		}

		
		function rand(){
	  		var text;
	  		var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
	    		text = possible.charAt(Math.floor(Math.random() * possible.length));
			searchVideos(text, 'rand');
		}

		function related(){
			jQuery.ajax({
			type: "GET",
			url: site+"related/"+localStorage.getItem('watching'),
			dataType: "json",
			success: function(res){
				printSearch(res, 'rel');
			},
			error: function(){
				console.log('error');}
			});
		}


function search_wiki(str){
	$('#wikiVid').html("Attendere il caricamento...");
	$.ajax({
		url: "https://en.wikipedia.org/w/api.php",
		method: 'GET',
		dataType: "jsonp",
		data: {
			action : "query",
			list: "search",
			srsearch: str,
			format: "json"
			},
		success: function(ris){
			search_wiki_content(ris.query.search[0].title);
		},
		error: function(err){
			$('#wikiVid').html('No document was founs');
		}
	});
}

function search_wiki_content(titolo_pagina){
	$.ajax({
		url: "https://en.wikipedia.org/w/api.php",
		method: 'GET',
		dataType: "jsonp",
		data: {
			action: "parse",
			page: titolo_pagina,
			format: "json"
		},
		success: function(ris){
			$('#wikiVid').html(ris.parse.text['*']);
		},
		error: function(err){
			$('#wikiVid').html('No document was found');
		}
	});
}

function isInGlobal(videoId){
	for(var i in global_pop){
		if(global_pop[i].videoId==videoId)
			return true;
	}
	return false;
}

function isInRelative(videoId){
        for(var i in global_relative){
                if(global_relative[i].videoId==videoId)
                        return true;
        }
        return false;
}

function addToGlobalPop(video){
	//esclude chi restituisce un json con campi non conformi alle specifiche
	if(video[0].videoId){
		while((global_pop.length<20)&&(video)&&(video.length!=0)){
			var object = video.shift();
			if(!isInGlobal(object.videoId))
				global_pop.push(object);
		}
	}
}

function relativeApiRequest(site){
	var APIurl = "http://site"+site+".tw.cs.unibo.it/globpop?id="+localStorage.getItem('watching');
	$.ajax({
		type: "GET",
		url: APIurl,
		success: function(res){
                        addToGlobalPop(res.recommended);
                },
		error: function(err){
                        console.log('Errore di richiesta API: '+err);
                }
	});
}

function apiRequest(site){
        var APIurl = "http://site"+site+".tw.cs.unibo.it/globpop?id=YYYYYY";
        $.ajax({
                type: "GET",
                url: APIurl,
                success: function(res){
                        addToGlobalPop(res.recommended);
                },
                error: function(err){
                        console.log('Errore di richiesta API: '+err);
                }
        });
}

function globalPopularity(){
	$("#GPA").html("Loading...");
	global_pop = [];
	$.when(
                apiRequest('1823'),
                apiRequest('1828'),
                apiRequest('1838'),
                apiRequest('1839'),
                apiRequest('1846'),
                apiRequest('1847'),
                apiRequest('1831'),
                apiRequest('1827'),
                apiRequest('1848'),
                apiRequest('1849'),
                apiRequest('1851'),
                apiRequest('1863'),
                apiRequest('1834'),
                apiRequest('1904'),
                apiRequest('1862'),
                apiRequest('1905')
                //apiRequest('1864') STRINGA NON JSON
		).then(function(){
			setTimeout(function (){
				printCronology(global_pop, "#GPA");
			}, 2000);
		});
}

function addToGlobalRelative(video){
	//esclude chi restituisce un json con campi non conformi alle specifiche
        if(video[0].videoId){
                while((global_relative.length<20)&&(video)&&(video.length!=0)){
                        var object = video.shift();
                        if(!isInRelative(object.videoId))
                                global_relative.push(object);
                }
        }
}

function apiRelative(site){
	var APIurl = "http://site"+site+".tw.cs.unibo.it/globpop?id="+localStorage.getItem('watching');
	$.ajax({
                type: "GET",
                url: APIurl,
                success: function(res){
                        addToGlobalRelative(res.recommended);
                },
                error: function(err){
                        console.log('Errore di richiesta API: '+err);
                }
        });

}

function globalRelative(){
	$("#GPR").html("Loading...");
	global_relative = [];
	$.when(
		apiRelative('1823'),
                apiRelative('1828'),
                apiRelative('1838'),
		apiRelative('1839'),
                apiRelative('1846'),
                apiRelative('1847'),
                apiRelative('1831'),
                apiRelative('1827'),
                apiRelative('1848'),
                apiRelative('1849'),
                apiRelative('1851'),
                apiRelative('1863'),
                apiRelative('1834'),
                apiRelative('1904'),
                apiRelative('1862'),
                apiRelative('1905')
	).then(function(){
		setTimeout(function(){
			printCronology(global_relative, "#GPR");
		}, 2000);
	});
}



/*
*	Description: Funzione che data una stringa fa il parsing e determina artista e titolo della canzone, se questo è possibile
*				 In caso di successo salva il nome dell'artista o band in 'artist' e il titolo della canzone in 'track', altrimenti questi rimangono vuoti
*	Parameters:
*	-"str": titolo del video di youtube da parsare
*/
function puliziaTitolo(str){

	console.log("inizio puliziaTitolo");

	var splitTitle = [] ;

	var check = {
		artistChecked: false,
		trackChecked: false,
		isArtist: false,
		isTrack: false
	};

	// weak parse
	str = str.replace(new RegExp(/\s*\([^\)]*\)/g), "");			// parentesi tonde
	str = str.replace(new RegExp(/\s*\[[^\]]*\]/g), "");			// parentesi quadre
	str = str.replace(new RegExp(/\s*\{[^\}]*\}/g), "");			// parentesi graffe
	str = str.replace(new RegExp(/\s*\"/g), "");					// virgolette moleste
	str = str.replace(new RegExp(/\s*1080p?/i), "");				// definizioni video
	str = str.replace(new RegExp(/\s*720p?/i), "");
	str = str.replace(new RegExp(/\s*hd/i), "");					// definizioni audio/video
	str = str.replace(new RegExp(/\s*full hd/i), "");
	str = str.replace(new RegExp(/\s*hq/i), "");

	// weak parse split
	splitTitle[3] = String(new RegExp(/\s*-+.*/).exec(str));
	splitTitle[2] = String(str.replace(splitTitle[3], ""));
	splitTitle[3] = String(splitTitle[3].replace(new RegExp(/\s*-+\s*/), ""));
	splitTitle[3] = String(splitTitle[3].replace(String((new RegExp(/\s*-+.*/)).exec(splitTitle[3])), ""));
	splitTitle[2] = String(splitTitle[2].replace(new RegExp(/\s*ft\..*/i), ""));
	splitTitle[2] = String(splitTitle[2].replace(new RegExp(/\s*feat\..*/i), ""));
	splitTitle[2] = String(splitTitle[2].replace(new RegExp(/\s*featuring\..*/i), ""));
	splitTitle[3] = String(splitTitle[3].replace(new RegExp(/\s*ft\..*/i), ""));
	splitTitle[3] = String(splitTitle[3].replace(new RegExp(/\s*feat\..*/i), ""));
	splitTitle[3] = String(splitTitle[3].replace(new RegExp(/\s*featuring\..*/i), ""));

	//full parse
	str = str.replace(new RegExp(/\s*u?o?fficiale?/i), "");			//parole che potrebbero essere decontestualizate
	str = str.replace(new RegExp(/\s*video/i), "");
	str = str.replace(new RegExp(/\s*clip/i), "");
	str = str.replace(new RegExp(/\s*originale?/i), "");
	str = str.replace(new RegExp(/\s*lyrics?/i), "");

	//full parse split
	splitTitle[1] = String(new RegExp(/\s*-+.*/).exec(str));
	splitTitle[0] = String(str.replace(splitTitle[1], ""));
	splitTitle[1] = String(splitTitle[1].replace(new RegExp(/\s*-+\s*/), ""));
	splitTitle[1] = String(splitTitle[1].replace(String((new RegExp(/\s*-+.*/)).exec(splitTitle[1])), ""));
	splitTitle[0] = String(splitTitle[0].replace(new RegExp(/\s*ft\..*/i), ""));
	splitTitle[0] = String(splitTitle[0].replace(new RegExp(/\s*feat\..*/i), ""));
	splitTitle[0] = String(splitTitle[0].replace(new RegExp(/\s*featuring\..*/i), ""));
	splitTitle[0] = String(splitTitle[0].replace(new RegExp(/\s*,.*/i), ""));
	splitTitle[1] = String(splitTitle[1].replace(new RegExp(/\s*ft\..*/i), ""));
	splitTitle[1] = String(splitTitle[1].replace(new RegExp(/\s*feat\..*/i), ""));
	splitTitle[1] = String(splitTitle[1].replace(new RegExp(/\s*featuring\..*/i), ""));
	splitTitle[1] = String(splitTitle[1].replace(new RegExp(/\s*,.*/i), ""));

	titleParsed = splitTitle[0] + " " + splitTitle[1] ;
	titleParsed_weak = splitTitle[2] + " " + splitTitle[3] ;

	checkIsArtist(splitTitle, 0, check);
	checkIsTrack(splitTitle, 0, check);
}

/*
*	Description: Funzione che interroga DBPedia per sapere se la stringa passata corrisponde al nome di un artista o band
*
*	Parameters:
*	- "array": array di stringhe (il titolo parsato)
*	- "index": indice dell'elemento (dell'array) che stiamo controllando
*	- "check": oggetto per il controllo dei risultati
*/
function checkIsArtist(array, index, check){
	var url = 'http://dbpedia.org/sparql';
	var query = [
		'ASK',
		'WHERE {',
			'?author <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/MusicalArtist>.',
			'?author <http://xmlns.com/foaf/0.1/name> ?name.',
			'FILTER regex(?name, "' + array[index] + '", "i")',
		'}'
	].join(' ');
	var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";

	$.ajax({
		url: queryUrl,
		success: function(res){

			if(res.boolean){

				check.isArtist = res.boolean;
				check.artistChecked = true;

				if(check.trackChecked)
					dataCheck(array, index, check);
			}
			else{

				var query = [
					'ASK',
					'WHERE {',
						'?band <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/Band>.',
						'?band <http://xmlns.com/foaf/0.1/name> ?name.',
						'FILTER regex(?name, "' + array[index] + '", "i")',
					'}'
				].join(' ');
				var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";

				$.ajax({
					url: queryUrl,
					success: function(res){

						check.isArtist = res.boolean;
						check.artistChecked = true;

						if(check.trackChecked)
							dataCheck(array, index, check);
					},
					error: function(err){
						console.log('ERROR on retrive DBPedia artist query');
					}
				});
			}
		},
		error: function(err){
			console.log('ERROR on retrive DBPedia artist query');
		}
	});
}

/*
*	Description: Funzione che interroga DBPedia per sapere se la stringa passata corrisponde al titolo di una canzone
*
* 	Parameters:
*	- "array": array di stringhe (il titolo parsato)
*	- "index": indice dell'elemento (dell'array) che stiamo controllando
*	- "check": oggetto per il controllo dei risultati
*/
function checkIsTrack(array, index, check){

	var url = 'http://dbpedia.org/sparql';
	var query = [
		'ASK',
		'WHERE {',
			'?track <http://dbpedia.org/ontology/musicalArtist> ?artist.',
			'?track <http://xmlns.com/foaf/0.1/name> ?title.',
			'FILTER regex(?title, "' + array[index] + '", "i")',
		'}'
	].join(' ');
	var queryUrl = url+"?query="+ encodeURIComponent(query) +"&format=json";

	$.ajax({
		url: queryUrl,
		success: function(res){

			check.isTrack = res.boolean ;
			check.trackChecked = true ;

			if(check.artistChecked)
				dataCheck(array, index, check);
		},
		error: function(err){
			console.log('ERROR on retrive DBPedia track query');
		}
	});
}

/*
*	Description: Funzione che interpreta i dati contenuti nell'oggetto di controllo e determina titolo e artista della canzone
*
* 	Parameters:
*	- "array": array di stringhe (il titolo parsato)
*	- "index": indice dell'elemento (dell'array) che stiamo controllando
*	- "check": oggetto per il controllo dei risultati
*/
function dataCheck(array, index, check){

	// se i dati sono utilizzabili allora viene salvato il tutto
	if(check.isArtist ^ check.isTrack){

		if(check.isArtist){

			if(index == 0 || index == 2){

				artist = array[index];
				track = array[index + 1];
			}
			else{

				artist = array[index];
				track = array[index - 1];
			}
		}
		else{

			if(index == 0 || index == 2){

				track = array[index];
				artist = array[index + 1];
			}
			else{

				track = array[index];
				artist = array[index - 1];
			}
		}

		search_wiki(artist);
	}
	else if(index < 3){

		// reset dell'oggetto di controllo
		check.artistChecked = false;
		check.trackChecked = false;
		check.isArtist = false;
		check.isTrack = false;

		// nuovo controllo dei dati, questa volta sull'elemento successivo dell'array
		checkIsArtist(array, index + 1, check)
		checkIsTrack(array, index + 1, check);
	}
	else{

		$('#wikiVid').html("Sorry! We couldn't find any information about this artist.");
	}
}

function artistSimilarity(){
	if(artist != ""){

		return $.ajax({
			url: site + "ytsearch/" + artist ,
			method: 'GET',
			dataType: "json",
			success: function(risp){

				// dalla risposta vengono tolti i video uguali a quello corrente
				for (i in risp){

					if (risp[i].id.videoId == localStorage.getItem('watching')){

						risp.splice(i, 1);
					}
				}

				printSearch(risp, 'artist');
			},
			error: function(err){

				$('#artist').html('<div class="container"><br><p>Sorry, artist not found.</p></div>');
				console.log('Richiesta dei video YouTube per Artist Similarity fallita.');
			}
		});
	}
	else
		$('#artist').html('<div class="container"><br><p>Sorry, artist not found.</p></div>');
}

/*
* 	Description: Verifica se il genere che gli viene passato e' un genere musicale e lo restituisce
*
*	Parametri:
*	- "code" e' una stringa che identifica un genere di un video YouTube.
*/
function codeToGenre(code) {
	var genre = '' ;
	switch(code)
	{
		case "/m/05fw6t":
			return "Children's music";
			break;

		case "/m/02mscn":
			return "Christian music";
			break;

		case "/m/0ggq0m":
			return "Classical music";
			break;

		case "/m/01lyv":
			return "Country";
			break;

		case "/m/02lkt":
			return "Electronic music";
			break;

		case "/m/0glt670":
			return "Hip hop music";
			break;

		case "/m/05rwpb":
			return "Independent music";
			break;

		case "/m/03_d0":
			return "Jazz";
			break;

		case "/m/028sqc":
			return "Music of Asia";
			break;

		case "/m/0g293":
			return "Music of Latin America";
			break;

		case "/m/064t9":
			return "Pop music";
			break;

		case "/m/06cqb":
			return "Reggae";
			break;

		case "/m/06j6l":
			return "Rhythm and blues";
			break;

		case "/m/06by7":
			return "Rock music";
			break;

		case "/m/0gywn":
			return "Soul music";
			break;

		default:
			break;
	}

	return '';
}

function genreFind(){
	var genreInfo = [] ;
	var gen = '' ;

	return $.ajax({
		url: site + "genreFind/" + localStorage.getItem('watching') ,
		method: 'GET',
		dataType: "json",
		success: function(risp){

			genreInfo = risp.items[0].topicDetails.relevantTopicIds ;

			$.each(genreInfo, function(index, object){
				
				gen = codeToGenre(object) ;
			});

			if(gen == '')
				gen = 'Music' ;
			genre = gen;
			genreSimilarity(gen);
		},
		error: function(err){

			$('#genre').html('<div class="container"><br><p>Sorry, genre not found.</p></div>');
			console.log('Richiesta del genere musicale del video YouTube fallita.');
		}
	});
}

function genreSimilarity(genre_code){
	$.ajax({
		url: site + "genreSim/" + genre_code ,
		method: 'GET',
		dataType: "json",
		success: function(risp){

			// dalla risposta vengono tolti i video uguali a quello corrente
			for (i in risp.items){

				if (risp.items[i].id.videoId == localStorage.getItem('watching')){

					risp.items.splice(i, 1);
				}
			}

			printSearch(risp.items, 'genre');
		},
		error: function(err){

			$('#genre').html('<div class="container"><br><p>Sorry, genre not found.</p></div>');
			console.log('Richiesta dei video YouTube per Genre Similarity fallita.');
		}
	});
}
