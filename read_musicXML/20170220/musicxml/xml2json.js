// Last edit: March 7, 2015 by Tom Collins.
// A reminder of how to test this. Open up a terminal, navigate to the freshjam
// folder, and execute:
// node candidates/musicxml/ k168-04.xml mozart_wolfgang_amadeus eee
// To convert a bunch of MusicXML files, navigate to the freshjam folder, and
// execute:
// data/xml2json.sh

var xmlParser = require('xml2js').parseString;
var util = require('./utility');
var aro = require('./array_operations');
// var converter = require('musicjson');
// var libxmljs = require("libxmljs");

exports.convert=function(xml,composerName,compositionTitle,callback){
  
  // Converts a MusicXML file to the json_score variable that can be imported
  // into the freshjam interface.
  var json_score = {};
  // Add a default score ID for now.
  // json_score.id = "KO3S1Y";
  // json_score.name = "Eine Kleine Nachtmusik, mvt.2";
	var composers = [];
	var lyricists = [];
	// json_score.composers = [{"id": "HH123F", "name": "mozart_wolfgang_amadeus",
  //                          "displayName": "Wolfgang Amadeus Mozart"}];
  
	xmlParser(xml, {trim: true}, function (err, responseXML){
    
		// Try getting title, composer, lyricist, and copyright. If importing from
		// kern format, a lot of this information is included in comments at the
		// top and bottom of the MusicXML file. Need to write code to try to grab
		// this automatically.
		if (responseXML['score-partwise'].credit){
			var metadata = responseXML['score-partwise'].credit;
		}
		else{
			var metadata = [];
		}
		for (meti = 0; meti < metadata.length; meti++){
			if (metadata[meti].$.page == 1 &&
					metadata[meti]["credit-words"][0].$["font-size"] >= "18" &&
					metadata[meti]["credit-words"][0].$.justify == "center" &&
					metadata[meti]["credit-words"][0].$.valign == "top"){
				// This is probably the title.
				// console.log(metadata[meti]["credit-words"][0]._);
				json_score.name = metadata[meti]["credit-words"][0]._;
				json_score.id = json_score.name.toLowerCase().replace(/\s/gi,'_').replace(/[^a-z0-9_]/gi,'');
			}
			if (metadata[meti].$.page == 1 &&
					metadata[meti]["credit-words"][0].$["font-size"] < "18" &&
					metadata[meti]["credit-words"][0].$.justify == "center" &&
					metadata[meti]["credit-words"][0].$.valign == "top"){
				// This is probably the subtitle.
				// console.log(metadata[meti]["credit-words"][0]._);
				json_score.remarks = metadata[meti]["credit-words"][0]._;
			}
			if (metadata[meti].$.page == 1 &&
					// metadata[meti]["credit-words"][0].$["font-size"] == "12" &&
					metadata[meti]["credit-words"][0].$.justify == "right" // &&
					// metadata[meti]["credit-words"][0].$.valign == "top"
					){
				// This is probably the composer.
				var display_name = metadata[meti]["credit-words"][0]._;
				var name_array = display_name.toLowerCase().split(' ');
				var name = name_array[name_array.length - 1];
				for (namei = 0; namei < name_array.length - 1; namei++){
					name = name + '_' + name_array[namei];
				}
				// Add a default composer ID for now.
				var composer_id = "HH123F";
				composers.push({"id": composer_id, "name": name,
											  "displayName": display_name});
			}
			if (metadata[meti].$.page == 1 &&
					// metadata[meti]["credit-words"][0].$["font-size"] == "12" &&
					metadata[meti]["credit-words"][0].$.justify == "left" // &&
					// metadata[meti]["credit-words"][0].$.valign == "top"
					){
				// This is probably the lyricist.
				var display_name = metadata[meti]["credit-words"][0]._;
				var name_array = display_name.toLowerCase().split(' ');
				var name = name_array[name_array.length - 1];
				for (namei = 0; namei < name_array.length - 1; namei++){
					name = name + '_' + name_array[namei];
				}
				// Add a default lyricist ID for now.
				var lyricist_id = "HL321X";
				lyricists.push({"id": lyricist_id, "name": name,
											  "displayName": display_name});
			}
			if (metadata[meti].$.page == 1 &&
					// metadata[meti]["credit-words"][0].$["font-size"] == "8" &&
					metadata[meti]["credit-words"][0].$.justify == "center" &&
					metadata[meti]["credit-words"][0].$.valign == "bottom"){
				// This is probably the copyright.
				json_score.copyright = metadata[meti]["credit-words"][0]._;
			}
		}
		json_score.composers = composers;
		json_score.lyricists = lyricists;
		if (json_score.name == undefined){
			json_score.name = "Insert title here";
		}
		if (json_score.copyright == undefined){
			json_score.copyright = "Insert copyright message here";
		}
		
		// Staff and clef names.
		// Get the staff names, abbreviations, IDs, and initial associated clefs
		// (for clef changes, see further below). We include initial associated
		// clefs because often people use these instead of instrument names to
		// refer to staves.
		var staff_and_clef_names = [];
		var staff_no = 0;
		if (responseXML["score-partwise"]["part-list"]){
			var part_list = responseXML["score-partwise"]["part-list"];
			if (part_list[0]["score-part"]){
				for (parti = 0; parti < part_list[0]["score-part"].length; parti++){
					// console.log('score_part:');
					// console.log(part_list[0]["score-part"][parti]);
					var curr_staff = {};
					curr_staff.name = part_list[0]["score-part"][parti]["part-name"][0];
					if (part_list[0]["score-part"][parti]["part-abbreviation"]){
						curr_staff.abbreviation
							= part_list[0]["score-part"][parti]["part-abbreviation"][0];
					
					}
					curr_staff.id = part_list[0]["score-part"][parti].$.id;
					// Use the ID to find the initial associated clef.
					curr_staff.clef = "unknown";
					var target_idx = -1;
					if (responseXML["score-partwise"]["part"]){
						partj = 0;
						while (partj < responseXML["score-partwise"]["part"].length){
							if (responseXML["score-partwise"]["part"][partj].$.id == curr_staff.id){
								target_idx = partj;
								partj = responseXML["score-partwise"]["part"].length - 1;
							}
							partj++;
						}
					}
					// console.log('target_idx:');
					// console.log(target_idx);
					if (target_idx >= 0 &&
							responseXML["score-partwise"]["part"][target_idx] &&
							responseXML["score-partwise"]["part"][target_idx].measure &&
							responseXML["score-partwise"]["part"][target_idx].measure[0].attributes){
						var curr_attr = responseXML["score-partwise"]["part"][target_idx].measure[0].attributes;
						// console.log('curr_attr:');
						// console.log(curr_attr);
						// We found the associated part - try to find the associated clef.
						var clef_attr = responseXML["score-partwise"]["part"][target_idx].measure[0].attributes[0].clef;
						// Handle MusicXML files created by hum2xml.
						if (clef_attr == undefined){
							var attri = 0;
							while (attri < curr_attr.length){
								if (curr_attr[attri].clef){
									clef_attr = curr_attr[attri].clef;
									attri = curr_attr.length - 1;
								}
								attri++;
							}
						}
						if (clef_attr == undefined){
							console.log('Could not associate any clefs with part ID: ' +
													curr_staff.id);
							console.log('We recommend editing the MusicXML file to ' +
													'explicity specify clefs for each staff, prior to ' +
													'upload.');
							curr_staff.staffNo = staff_no;
							// console.log('curr_staff:');
							// console.log(curr_staff);
							staff_and_clef_names.push(aro.copy_array_object(curr_staff));
							staff_no = staff_no + 1;
						}
						else{
							// console.log('clef_attr:');
							// console.log(clef_attr);
							for (clefi = 0; clefi < clef_attr.length; clefi++){
								curr_staff.clefSign = clef_attr[clefi].sign[0];
								curr_staff.clefLine = parseInt(clef_attr[clefi].line[0]);
								if (clef_attr[clefi]["clef-octave-change"]){
									curr_staff.clefOctaveChange = clef_attr[clefi]["clef-octave-change"][0];
								}
								curr_staff.clef = util.clef_sign_and_line2clef_name(curr_staff.clefSign,
																																		curr_staff.clefLine,
																																		curr_staff.clefOctaveChange);
								curr_staff.staffNo = staff_no;
								// console.log('curr_staff:');
								// console.log(curr_staff);
								staff_and_clef_names.push(aro.copy_array_object(curr_staff));
								staff_no = staff_no + 1;
							}
						}
					}
				}
			}
		}
		json_score.staffAndClefNames = staff_and_clef_names;
		
		// Key signatures.
		var key_sig_array = [];
		json_score.keySignatures = key_sig_array;
		// This is populated in the iteration over measures within each part,
		// because different parts can have independent key signatures.
		
    // Retrieve all parts in the Music XML file.
    var part = responseXML['score-partwise'].part;
    
    // Focus on the top staff first, to get things like the divisions value
    // and any time signature changes.
    var measure = part[0].measure;
		
    // Define the divisions value. There should be one of these for the whole
    // piece of music.
    if(measure[0].attributes){
      var attributes = measure[0].attributes;
      for(var j = 0; j < attributes.length; j++){
        if(attributes[j].divisions){
          var divisions = parseInt(attributes[j].divisions[0]);
          console.log('Divisions: ' + divisions);
        }
      }
    }
    
    // Handle an anacrusis here.
		// console.log('bar_1:');
		// console.log(measure[0]);
		var anacrusis_and_crotchets_per_bar
		  = util.convert_1st_bar2anacrusis_val(measure[0], divisions);
		var anacrusis = anacrusis_and_crotchets_per_bar[0];
		var crotchets_per_bar = anacrusis_and_crotchets_per_bar[1];
		console.log('anacrusis:');
		console.log(anacrusis);
		console.log('crotchets_per_bar:');
		console.log(crotchets_per_bar);
		
		// Time signatures array. We only need to do this for one staff. It should
		// apply across all other staves.
    var time_sig_array = [];
    for (var measure_index = 0; measure_index < measure.length; measure_index++){
      if (measure[measure_index].attributes){
        var attributes = measure[measure_index].attributes;
        for (var j = 0; j < attributes.length; j++){
          if (attributes[j].time){
            // Assuming there is only one time per attribute...
            var time_sig_curr = {};
            time_sig_curr.barNo = measure_index + (anacrusis == 0);
            time_sig_curr.topNo = parseInt(attributes[j].time[0].beats[0]);
            time_sig_curr.bottomNo = parseInt(attributes[j].time[0]['beat-type'][0]);
            console.log('A time signature in bar: ' + time_sig_curr.barNo + ', top number: ' + time_sig_curr.topNo
												+ ', bottom number: ' + time_sig_curr.bottomNo);
            // console.log(attributes[j].time[0].beats[0])+"\n";
            time_sig_array.push(time_sig_curr);
          }
        }
      }
    }
		if (anacrusis != 0) {
			time_sig_array
			  = util.append_ontimes_to_time_signatures(
				  time_sig_array, crotchets_per_bar);
    }
		else {
			time_sig_array = util.append_ontimes_to_time_signatures(time_sig_array);
    }
    // console.log('Time signatures array: ' + time_sig_array);
    json_score.timeSignatures = time_sig_array;
		
		// Tempo changes.
		var tempo_changes = [];
		json_score.tempi = tempo_changes;
		
		// Clef changes.
		var clef_changes = [];
		json_score.clefChanges = [];
		
		// Sequencing (repeat marks, 1st, 2nd time, da capo, etc.). We only need to
		// do this for one staff. It should apply across all other staves.
		var sequencing = [];
		for (var measure_index = 0; measure_index < measure.length; measure_index++){
			// Direction to do with barline, or 1st, 2nd-time bars.
      if (measure[measure_index].barline){
        var barline = measure[measure_index].barline;
        for (var j = 0; j < barline.length; j++){
					// console.log('sequencing command:');
					// console.log(barline[j].repeat);
					var curr_sequence = {};
					curr_sequence.barNo = measure_index + (anacrusis == 0);
					curr_sequence.type = "barline";
					if (barline[j].$ && barline[j].$.location){
						curr_sequence.location = barline[j].$.location;
					}
					if (barline[j].ending){
						curr_sequence.endingNo = barline[j].ending[0].$.number;
						curr_sequence.endingType = barline[j].ending[0].$.type;
					}
					if (barline[j].style){
						curr_sequence.style = barline[j].style;
					}
					if (barline[j].repeat){
						curr_sequence.repeatDir = barline[j].repeat[0].$.direction;
					}
					// console.log('Bar number:');
					// console.log(curr_sequence.barNo);
					// console.log('curr_sequence:');
					// console.log(curr_sequence);
					curr_sequence.ontime
					  = util.ontime_of_bar_and_beat_number(
							curr_sequence.barNo, 1, time_sig_array);
					sequencing.push(curr_sequence);
        }
      }
			// Direction like dal segno.
			if (measure[measure_index].direction){
				var direction = measure[measure_index].direction;
				for (var j = 0; j < direction.length; j++){
					if (direction[j]["direction-type"] &&
							direction[j]["direction-type"][0].words){
						// console.log('direction:');
						// console.log(direction[j]);
						var poss_commands = ["Fine", "D.C.", "D.C. al Fine",
																 "D.C. al Coda", "D.S. al Coda",
																 "D.S. al Fine", "D.S.", "To Coda"];
						var target_idx
							= poss_commands.indexOf(direction[j]["direction-type"][0].words[0]);
						// console.log('target_idx:');
						// console.log(target_idx);
						if (target_idx >= 0){
							var curr_sequence = {};
							curr_sequence.barNo = measure_index + (anacrusis == 0);
							curr_sequence.type = "command";
							curr_sequence.placement = direction[j].$.placement;
							curr_sequence.words = direction[j]["direction-type"][0].words[0];
							curr_sequence.ontime
								= util.ontime_of_bar_and_beat_number(
									curr_sequence.barNo, 1, time_sig_array);
							sequencing.push(curr_sequence);
						}
					}
				}
			}
    }
		
		// Define the page layout array object, which contains information relating
		// to system breaks, page breaks, system spacers, etc. For page and system
		// breaks, current thinking is we only need to do this for one staff,
		// because it should apply. Spacers (which put a bit more or less space
		// between pairs of staves within or between systems when required) do not
		// seem to be exported in the MusicXML file, but if they were, these would
		// need identifying across all parts.
		var page_layout = {};
		var page_breaks = [];
		var system_breaks = [];
		// var spacers = [];
		for (var measure_index = 0; measure_index < measure.length; measure_index++){
      if(measure[measure_index].print){
				// console.log('Print command!');
				// console.log(measure[measure_index].print);
				var print_array = measure[measure_index].print;
				for (printi = 0; printi < print_array.length; printi++){
					if (print_array[printi].$ &&
							print_array[printi].$["new-page"]){
						page_breaks.push(measure_index + (anacrusis == 0));
					}
					if (print_array[printi].$ &&
							print_array[printi].$["new-system"]){
						system_breaks.push(measure_index + (anacrusis == 0));
					}
				}
			}
		}
		if (page_breaks.length == 0 && system_breaks.length == 0){
			// Insert default page and system breaks.
			var page_and_system_breaks
			  = util.default_page_and_system_breaks(
					staff_and_clef_names, measure.length);
			page_breaks = page_and_system_breaks[0];
			system_breaks = page_and_system_breaks[1];
		}
		page_layout.pageBreaks = page_breaks;
		page_layout.systemBreaks = system_breaks;
		
    // Iterate over each part and build up the notes array.
    
    // Define the notes array.
    var notes_array = [];
		var noteID = 0;
		var tied_array = [];
		var grace_array = [];
		// Define the rests array. This is not necessary for displaying a freshjam
		// project, but the information is present in the MusicXML file (and could
		// help us display the traditional staff notation). So in the interests of
		// lossless conversion, I'm storing the rest information too.
		var rests_array = [];
		var restID = 0;
		// Define the expressions array. This is not necessary for displaying a
		// freshjam project, but the information is present in the MusicXML file
		// (and could help us display the traditional staff notation). So in the
		// interests of lossless conversion, I'm storing the rest information too.
		var xprss_array = [];
		var xprssID = 0;
		
    for (var part_idx = 0; part_idx < part.length; part_idx++){
      
      console.log('Part: ' + part_idx);
			var ontime = anacrusis;
			// Incrementing integer representation of ontime, using divisions.
			var intOnt = anacrusis*divisions;
			var part_id = part[part_idx].$.id;
			// This variable tells you which staff number(s) should be associated
			// with a particular part. In MusicXML 2.0, keyboard instruments such as
			// piano or harpsichord will have two staves written within one part.
			var staff_nos_for_this_id = [];
			for (staffi = 0; staffi < staff_and_clef_names.length; staffi++){
				if (staff_and_clef_names[staffi].id == part_id){
					staff_nos_for_this_id.push(staff_and_clef_names[staffi].staffNo);
				}
			}
			// console.log('staff_nos_for_this_id:');
			// console.log(staff_nos_for_this_id);
			
      measure = part[part_idx].measure;
      for (var measure_index = 0; measure_index < measure.length; measure_index++){
        
        // console.log('\nMeasure: ' + measure_index);
				
				// Key signatures and clef changes.
				if(measure[measure_index].attributes){
					var attributes = measure[measure_index].attributes;
					// console.log('attributes:');
					// console.log(attributes);
					for(var j = 0; j < attributes.length; j++){
						// Key signatures.
						if(attributes[j].key){
							// console.log('key:');
							// console.log(attributes[j].key);
							var curr_key = {};
							curr_key.barNo = measure_index + (anacrusis == 0);
							if (attributes[j].key[0].mode == undefined){
								attributes[j].key[0].mode = ['major'];
							}
							curr_key.keyName
							= util.nos_symbols_and_mode2key_name(attributes[j].key[0].fifths[0],
																									 attributes[j].key[0].mode[0]);
							
							// It is important to realise that when a MusicXML file says
							// fifths, what it means is the number of sharps (positive
							// integer) or flats (negative integer) in the key signature. So
							// A minor will have a fifths value of 0, but A is three steps
							// clockwise from C on the circle of fifths, so this code adjusts
							// the fifths value of minor keys to reflect this.
							switch(attributes[j].key[0].mode[0]){
								case 'minor':
									curr_key.fifthSteps = parseInt(attributes[j].key[0].fifths[0]) + 3;
									break;
								default:
									curr_key.fifthSteps = parseInt(attributes[j].key[0].fifths[0]);
									break;
							}
							switch(attributes[j].key[0].mode[0]){
								case 'major':
									curr_key.mode = 0;
									break;
								case 'minor':
									curr_key.mode = 5;
									break;
								case 'ionian':
									curr_key.mode = 0;
									break;
								case 'dorian':
									curr_key.mode = 1;
									break;
								case 'phrygian':
									curr_key.mode = 2;
									break;
								case 'lydian':
									curr_key.mode = 3;
									break;
								case 'mixolydian':
									curr_key.mode = 4;
									break;
								case 'aeolian':
									curr_key.mode = 5;
									break;
								case 'locrian':
									curr_key.mode = 6;
									break;
							}
							curr_key.staffNo = []; // Populated in for loop below.
							// Get ontime from bar number rather than from the ontime
							// variable, because there could still be rounding errors here.
							curr_key.ontime
								= util.ontime_of_bar_and_beat_number(curr_key.barNo, 1, time_sig_array);
							for (staffi = 0; staffi < staff_nos_for_this_id.length; staffi++){
								curr_key.staffNo = staff_nos_for_this_id[staffi];
								key_sig_array.push(aro.copy_array_object(curr_key));
							}
						}
						
						// Clef changes.
						if(attributes[j].clef){
							var clef_attr = attributes[j].clef;
							// console.log('clef in measure ' + measure_index + ':');
							// console.log(clef_attr);
							var curr_clef = {};
							curr_clef.barNo = measure_index + (anacrusis == 0);
							// Get ontime from bar number rather than from the ontime
							// variable, because there could still be rounding errors here.
							curr_clef.ontime
								= util.ontime_of_bar_and_beat_number(curr_clef.barNo, 1, time_sig_array);
							curr_clef.clef = "unknown"; // Populated below.
							for (clefi = 0; clefi < clef_attr.length; clefi++){
								curr_clef.clefSign = clef_attr[clefi].sign[0];
								curr_clef.clefLine = parseInt(clef_attr[clefi].line[0]);
								if (clef_attr[clefi]["clef-octave-change"]){
									curr_clef.clefOctaveChange = clef_attr[clefi]["clef-octave-change"][0];
								}
								curr_clef.clef = util.clef_sign_and_line2clef_name(curr_clef.clefSign,
																																		curr_clef.clefLine,
																																		curr_clef.clefOctaveChange);
								if (clef_attr[clefi].$ && clef_attr[clefi].$.number){
									// console.log('clef number:');
									// console.log(clef_attr[clefi].$.number);
									curr_clef.staffNo
									  = staff_nos_for_this_id[parseInt(clef_attr[clefi].$.number[0]) - 1];
								}
								else{
									curr_clef.staffNo = staff_nos_for_this_id[0];
								}
								// curr_clef.staffNo = staff_no;
								// console.log('curr_staff:');
								// console.log(curr_staff);
								clef_changes.push(aro.copy_array_object(curr_clef));
								// staff_no = staff_no + 1;
							}
						}
					}
				}
				
				// Tempo changes and expressions.
				if (measure[measure_index].direction){
					var direction = measure[measure_index].direction;
					for (var j = 0; j < direction.length; j++){
						// Tempo change.
						if (direction[j].sound &&
								direction[j].sound[0].$ &&
								direction[j].sound[0].$.tempo){
							curr_tempo = {};
							// Timing will need updating to be more precise.
							curr_tempo.barOn = measure_index + (anacrusis == 0);
							curr_tempo.beatOn = 1;
							curr_tempo.ontime
							  = util.ontime_of_bar_and_beat_number(
									curr_tempo.barOn, 1, time_sig_array);
							curr_tempo.bpm = parseFloat(direction[j].sound[0].$.tempo);
							// console.log('direction-type:');
							// console.log(direction[j]["direction-type"]);
							if (direction[j]["direction-type"] &&
									direction[j]["direction-type"][0].words){
								curr_tempo.tempo = direction[j]["direction-type"][0].words[0];
							}
							if (aro.arrayObjectIndexOf(
										tempo_changes, curr_tempo.ontime, "ontime") == -1){
								// Some MusicXML files contain duplicate tempo instructions.
								// The check above will not allow tempo instructions with the
								// same ontime as an existing tempo instruction to be inserted
								// in the tempo_changes array.
								tempo_changes.push(curr_tempo);
							}
						}
						// Expression - dynamic.
						if (direction[j]["direction-type"] &&
								direction[j]["direction-type"][0].dynamics){
							curr_xprss = {};
							curr_xprss.ID = xprssID.toString();
							// Timing will need updating to be more precise.
							curr_xprss.barOn = measure_index + (anacrusis == 0);
							curr_xprss.beatOn = 1;
							curr_xprss.ontime
							  = util.ontime_of_bar_and_beat_number(
									curr_xprss.barOn, 1, time_sig_array);
							for (var key in direction[j]["direction-type"][0].dynamics[0]){
								// This is not really a loop because there is probably only one
								// key.
								curr_xprss.type = { "dynamics": key };
								curr_xprss.placement = direction[j].$.placement;
								if (direction[j].staff){
									curr_xprss.staffNo
									  = staff_nos_for_this_id[parseInt(direction[j].staff[0]) - 1];
								}
								else{
									curr_xprss.staffNo = staff_nos_for_this_id[0];
								}
								xprss_array.push(curr_xprss);
								xprssID++;
							}
						}
						// Expression - wedge.
						if (direction[j]["direction-type"] &&
								direction[j]["direction-type"][0].wedge){
							curr_xprss = {};
							curr_xprss.ID = xprssID.toString();
							// Timing will need updating to be more precise.
							curr_xprss.barOn = measure_index + (anacrusis == 0);
							curr_xprss.beatOn = 1;
							curr_xprss.ontime
							  = util.ontime_of_bar_and_beat_number(
									curr_xprss.barOn, 1, time_sig_array);
							// console.log('wedge:');
							// console.log(direction[j]["direction-type"][0].wedge[0]);
							curr_xprss.type = { "wedge": direction[j]["direction-type"][0].wedge[0].$.type };
							curr_xprss.placement = direction[j].$.placement;
							if (direction[j].staff){
									curr_xprss.staffNo
									= staff_nos_for_this_id[parseInt(direction[j].staff[0]) - 1];
							}
							else{
								curr_xprss.staffNo = staff_nos_for_this_id[0];
							}
							xprss_array.push(curr_xprss);
							xprssID++;
						}
					}
				}
				
				// Grab the number of backups, which are used to encode multiple voices
        // in one measure on one staff.
        if (measure[measure_index].backup){
          var backups = measure[measure_index].backup;
          // console.log('Backup: ' + backups);
          var time_at_end_of_this_bar =
					  util.ontime_of_bar_and_beat_number(
						  measure_index + (anacrusis == 0) + 1, 1, time_sig_array);
          // console.log('Time at end of bar: ' + time_at_end_of_this_bar);
        }
				else{
					backups = undefined;
				}
        
        if (measure[measure_index].note){
          var notes = measure[measure_index].note;
          // console.log('Notes:');
          // console.log(notes);
          
          var voiceNo = 0; // Increment this with appearances of backup.
          for (note_index = 0; note_index < notes.length; note_index++){
            
            // console.log('Note index: ' + note_index);
            var note_curr = {};
            var rest = 0; // Detect if it is a rest instead of a note.
						var rest_curr = {};
            
            if (notes[note_index].grace == undefined){
              // Handle pitch information.
              if (notes[note_index].pitch){
								
								var final_pitch =
									xml_pitch2pitch_class_and_octave(notes[note_index].pitch[0]);
								var MNN_MPN = util.pitch_and_octave_to_midi_note_morphetic_pair(final_pitch);
                // Populate note_curr properties.
								note_curr.ID = noteID.toString();
								// console.log('NoteID: ' + note_curr.ID);
								noteID++;
                note_curr.pitch = final_pitch;
                note_curr.MNN = MNN_MPN[0];
                note_curr.MPN = MNN_MPN[1];
								// console.log('Pitch: ' + final_pitch_str + ', MNN: ' + MNN_MPN[0] + ', MPN: ' + MNN_MPN[1]);
              }
              else { // Rest.
                rest = 1;
								rest_curr.ID = restID.toString();
								restID++;
              }
              
							// Handle timing information.
							// Begin with the integer duration expressed in MusicXML divisions.
							var intDur = parseInt(notes[note_index].duration[0]);
              // This is duration in crotchet beats rounded to 5 decimal places.
              var duration = Math.round(intDur/divisions*100000)/100000;
							// This is offtime in crotchet beats rounded to 5 decimal places.
							var offtime = Math.round((intOnt + intDur)/divisions*100000)/100000;
							
							var bar_beat = util.bar_and_beat_number_of_ontime(ontime, time_sig_array);
              var barOn = bar_beat[0];
              var beatOn = Math.round(bar_beat[1]*100000)/100000;
              var bar_beat = util.bar_and_beat_number_of_ontime(offtime, time_sig_array);
              var barOff = bar_beat[0];
              var beatOff = Math.round(bar_beat[1]*100000)/100000;
							
							// Legacy version in operation from November 2014 to August 2015
							// that did not handle tuplets properly (led to rounding errors).
							//if (notes[note_index]['time-modification']){
							//	// Some kind of tuplet, but actually I think duration calculation does not change.
							//	// This is duration in crotchet beats rounded to 5 decimal places.
							//	var duration = Math.round(intDur/divisions*100000)/100000;
							//	//var dur_unround = intDur/divisions;
							//	//var duration = Math.round(dur_unround
							//	//                          *notes[note_index]['time-modification'][0]['normal-notes'][0]
							//	//                          /notes[note_index]['time-modification'][0]['actual-notes'][0]
							//	//                          *100000)/100000;
							//}
							//else {
							//	// This is duration in crotchet beats rounded to 5 decimal places.
							//	var duration = Math.round(intDur/divisions*100000)/100000;
							//}
							//// Correct rounding errors in the ontime values.
							//var onDiscrep = Math.ceil(ontime) - ontime;
							//if (onDiscrep < .00002){
							//	ontime = Math.ceil(ontime);
							//}
							//var offtime = Math.round((ontime + duration)*100000)/100000;
							//// Correct rounding errors in the offtime values.
							//var offDiscrep = Math.ceil(offtime) - offtime;
							//if (offDiscrep < .00002){
							//	offtime = Math.ceil(offtime);
							//}
							
							// Useful debug for checking rounding errors.
							//if (note_curr.ID == '666') {
							//	var testSum = Math.round((ontime + intDur/divisions)*100000)/100000;
							//	console.log('barOn: ' + barOn);
							//	console.log('beatOn: ' + beatOn);
							//	console.log('divisions: ' + divisions);
							//	console.log('intDur: ' + intDur);
							//	console.log('ontime: ' + ontime);
							//	// console.log('onDiscrep: ' + onDiscrep);
							//	console.log('offtime: ' + offtime);
							//	// console.log('offDiscrep: ' + offDiscrep);
							//	console.log('testSum: ' + testSum);
							//	console.log('intOnt: ' + intOnt);
							//}
							
              // Populate note_curr properties or rest_curr properties.
							if (rest == 0){
								note_curr.barOn = barOn;
								note_curr.beatOn = beatOn;
								note_curr.ontime = ontime;
								note_curr.duration = duration;
								note_curr.barOff = barOff;
								note_curr.beatOff = beatOff;
								note_curr.offtime = offtime;
								var staff_and_voice_nos
								  = util.staff_voice_xml2staff_voice_json(
										notes[note_index].voice, staff_nos_for_this_id, part_idx);
								note_curr.staffNo = staff_and_voice_nos[0];
								note_curr.voiceNo = staff_and_voice_nos[1];
								// Could add some more properties here, like integer duration
								// as expressed in the MusicXML file, stem direction, etc. NB,
								// if there are ties here, properties such as intDur, type,
								// stem, beam, etc. are not accurate reflections of the summary
								// oblong properties, and they are removed by resolve_ties.
								// Lyric.
								if (notes[note_index].lyric){
									var lyric_arr = notes[note_index].lyric;
									var lyric = [];
									for (ily = 0; ily < lyric_arr.length; ily++){
										lyric_curr = {};
										lyric_curr.number = parseInt(lyric_arr[ily].$.number);
										// console.log('lyric_arr[ily].text[0]._:');
										// console.log(lyric_arr[ily].text[0]._);
										lyric_curr.syllabic = lyric_arr[ily].syllabic[0];
                    if (lyric_arr[ily].text[0]._ == undefined){
                      lyric_curr.text = lyric_arr[ily].text[0];
                    }
                    else {
                      lyric_curr.text = lyric_arr[ily].text[0]._;
                    }
										if (lyric_arr[ily].text[0].$ !== undefined &&
                        lyric_arr[ily].text[0].$["font-family"] !== undefined){
                      lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-family"];
                    }
                    if (lyric_arr[ily].text[0].$ !== undefined &&
                        lyric_arr[ily].text[0].$["font-size"] !== undefined){
                      lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-size"];
                    }
                    if (lyric_arr[ily].text[0].$ !== undefined &&
                        lyric_arr[ily].text[0].$["font-style"] !== undefined){
                      lyric_curr.fontFamily = lyric_arr[ily].text[0].$["font-style"];
                    }
										lyric.push(lyric_curr);
									}
									note_curr.lyric = lyric;
								}
								// Integer duration.
								note_curr.intDur = intDur;
								// Accidental.
								if (notes[note_index].accidental){
									// Written accidentals like natural, sharp, flat, etc.
									note_curr.accidental = notes[note_index].accidental[0];
								}
								// Type.
								if (notes[note_index].type){
									// Things like quarter note, eighth note, etc.
									note_curr.type = notes[note_index].type[0];
								}
								// Tuplets.
								if (notes[note_index]['time-modification']){
									note_curr.timeMod = {
										"actualNotes":
										notes[note_index]['time-modification'][0]['actual-notes'][0],
										"normalNotes":
										notes[note_index]['time-modification'][0]['normal-notes'][0]
									};
								}
								// Stems.
								if (notes[note_index].stem){
									note_curr.stem = notes[note_index].stem[0];
								}
								// Beams.
								if (notes[note_index].beam){
									var beams = [];
									for (ibeam = 0; ibeam < notes[note_index].beam.length; ibeam++){
										var beam_curr = {};
										beam_curr.number = parseInt(notes[note_index].beam[ibeam].$.number);
										if (notes[note_index].beam[ibeam].$.accel){
											beam_curr.accel = notes[note_index].beam[ibeam].$.accel;
										}
										beam_curr.type = notes[note_index].beam[ibeam]._;
										beams.push(beam_curr);
									}
									note_curr.beam = beams;
								}
								// Notations.
								if (notes[note_index].notations){
									var notations = {};
									// Articulations.
									if (notes[note_index].notations[0].articulations){
										var artic_arr = notes[note_index].notations[0].articulations[0];
										// console.log('articulations:');
										// console.log(artic_arr);
										var articulations = {};
										for (var key in artic_arr){
											articulations[key] = {};
                      // articulations.push(key);
										}
										notations.articulations = articulations;
									}
                  // Include fermata in articulations also.
									if (notes[note_index].notations[0].fermata){
                    if (articulations == undefined){
                      console.log('We got here with artics.');
                      var articulations = {};
                    }
										var fermata_arr = notes[note_index].notations[0].fermata;
                    for (iferm = 0; iferm < fermata_arr.length; iferm++){
                      if (fermata_arr[iferm].$.type == 'upright'){
                        articulations.fermataUpright = {};
                      }
                      if (fermata_arr[iferm].$.type == 'inverted'){
                        articulations.fermataInverted = {};
                      }
										}
                    if (notations.articulations == undefined){
                      notations.articulations = articulations;
                      console.log('We got here with notations.articulations');
                      console.log(notations.articulations);
                    }
										//var fermata = [];
										//for (iferm = 0; iferm < fermata_arr.length; iferm++){
										//	fermata.push(fermata_arr[iferm].$.type);
										//}
										//notations.fermata = fermata;
									}
									// Ornaments.
									if (notes[note_index].notations[0].ornaments){
										var ornam_arr = notes[note_index].notations[0].ornaments[0];
										var ornaments = [];
										for (var key in ornam_arr){
											ornaments.push(key);
										}
										notations.ornaments = ornaments;
									}
									// Slurs.
									if (notes[note_index].notations[0].slur){
										var slur_arr = notes[note_index].notations[0].slur;
										// console.log('slur:');
										// console.log(slur_arr);
										var slur = [];
										for (islur = 0; islur < slur_arr.length; islur++){
											slur_curr = {};
											slur_curr.number = parseInt(slur_arr[islur].$.number);
											slur_curr.type = slur_arr[islur].$.type;
											slur.push(slur_curr);
										}
										notations.slur = slur;
									}
									// Technical.
									if (notes[note_index].notations[0].technical){
										var techn_arr = notes[note_index].notations[0].technical[0];
										// var technical = [];
										//for (var key in techn_arr){
										//	technical.push(key);
										//}
										// notations.technical = technical;
          notations.technical = techn_arr;
									}
									// Tuplet.
									if (notes[note_index].notations[0].tuplet){
										var tuplet = notes[note_index].notations[0].tuplet[0];
										tupl_curr = {};
										tupl_curr.type = tuplet.$.type;
										if (tuplet.$.bracket){
											tupl_curr.bracket = tuplet.$.bracket;
										}
                    if (tuplet.$["show-number"]){
                      tupl_curr.showNumber = tuplet.$["show-number"];
                    }
										notations.tuplet = tupl_curr;
									}
									
									// Assign the notations field to note_curr.
									note_curr.notations = notations;
								}
								
								if (!notes[note_index].tie){ // there is no tie element
									// Ordinary untied note. Push it to the notes array.
									notes_array.push(note_curr);
								}
								else { // there is a tie element
									
                  // you can access attributes using a dollar sign like so:
									// console.log(notes[note_index].tie[0].$.type)
									var tie = note_curr.tieType = notes[note_index].tie;
									if (tie.length > 1) {
										note_curr.tieType = 'stop and start';
									}
									else {
										note_curr.tieType = tie[0].$.type;
									}
									// console.log(note_curr.tieType);
									
                  // Tied note. Push it to the tied notes array for resolving
                  // below.
                  tied_array.push(note_curr);
								}
							}
							else {
								rest_curr.barOn = barOn;
								rest_curr.beatOn = beatOn;
								rest_curr.ontime = ontime;
								rest_curr.duration = duration;
								rest_curr.barOff = barOff;
								rest_curr.beatOff = beatOff;
								rest_curr.offtime = offtime;
								var staff_and_voice_nos
								  = util.staff_voice_xml2staff_voice_json(
										notes[note_index].voice, staff_nos_for_this_id, part_idx);
								rest_curr.staffNo = staff_and_voice_nos[0];
								rest_curr.voiceNo = staff_and_voice_nos[1];
								// Could add some more properties here, like integer duration
								// as expressed in the MusicXML, etc.
								rest_curr.intDur = intDur;
								// Type.
                if (notes[note_index].type){
									rest_curr.type = notes[note_index].type[0];
								}
                // Tuplets.
                if (notes[note_index]['time-modification']){
									rest_curr.timeMod = {
										"actualNotes":
										notes[note_index]['time-modification'][0]['actual-notes'][0],
										"normalNotes":
										notes[note_index]['time-modification'][0]['normal-notes'][0]
									};
								}
                // Notations. Could add more here (see a note's notations for
                // further examples, but they don't seem relevant).
								if (notes[note_index].notations){
									var notations = {};
                  // Fermata.
									if (notes[note_index].notations[0].fermata){
										var fermata_arr = notes[note_index].notations[0].fermata;
										// console.log('fermata:');
										// console.log(fermata_arr);
										var fermata_arr = notes[note_index].notations[0].fermata;
										var fermata = [];
										for (iferm = 0; iferm < fermata_arr.length; iferm++){
											fermata.push(fermata_arr[iferm].$.type);
										}
										notations.fermata = fermata;
									}
									// Tuplet.
									if (notes[note_index].notations[0].tuplet){
										var tuplet = notes[note_index].notations[0].tuplet[0];
										tupl_curr = {};
										tupl_curr.type = tuplet.$.type;
										if (tuplet.$.bracket){
											tupl_curr.bracket = tuplet.$.bracket;
										}
                    if (tuplet.$["show-number"]){
                      tupl_curr.showNumber = tuplet.$["show-number"];
                    }
										notations.tuplet = tupl_curr;
									}
                  
                  // Assign the notations field to note_curr.
									rest_curr.notations = notations;
                }
								
								rests_array.push(rest_curr);
							}
              
              // If the note is a second, third, etc. note of a chord, then do
              // not increment the ontime variable.
              if (note_index < notes.length - 1 && notes[note_index + 1].chord){
              }
              else { // Do increment the ontime value.
                ontime = offtime;
								intOnt = intOnt + intDur;
              }
              
              // Check whether we should switch to define notes in the next voice.
              // If so, we will need to subtract the backup value from the running
              // ontime.
              if(backups !== undefined){
                if (ontime == time_at_end_of_this_bar &&
                    voiceNo < backups.length){
                  dur_to_subtract = Math.round(parseInt(backups[voiceNo].duration[0])/divisions
                                               *100000)/100000;
                  // console.log('We got here!');
                  // console.log('With ontime:');
                  // console.log(ontime);
                  // console.log('And ontime at end of bar:');
                  // console.log(time_at_end_of_this_bar);
                  ontime = ontime - dur_to_subtract;
									intOnt = intOnt - parseInt(backups[voiceNo].duration[0]);
                  voiceNo++;
                }
              }
            }
						else{
              // Handle grace notes here. NB grace notes have no duration.
              
							if (notes[note_index].pitch){
								// Grace notes must, by definition, have a pitch? I'm leaving
								// the check in here just in case.
								var final_pitch =
									xml_pitch2pitch_class_and_octave(notes[note_index].pitch[0]);
								var MNN_MPN = util.pitch_and_octave_to_midi_note_morphetic_pair(final_pitch);
                // Populate grace_curr properties.
								var grace_curr = {};
								grace_curr.ID = noteID.toString();
								noteID++;
								// console.log('grace:');
								// console.log(notes[note_index].grace);
								if (notes[note_index].grace[0].$ != undefined){
									grace_curr.slash = notes[note_index].grace[0].$.slash;
								}
                grace_curr.pitch = final_pitch;
                grace_curr.MNN = MNN_MPN[0];
                grace_curr.MPN = MNN_MPN[1];
								var staff_and_voice_nos
								  = util.staff_voice_xml2staff_voice_json(
										notes[note_index].voice, staff_nos_for_this_id, part_idx);
								grace_curr.staffNo = staff_and_voice_nos[0];
								grace_curr.voiceNo = staff_and_voice_nos[1];
								// Accidental.
								if (notes[note_index].accidental){
									// Written accidentals like natural, sharp, flat, etc.
									grace_curr.accidental = notes[note_index].accidental[0];
								}
								// Type.
								if (notes[note_index].type){
									// Things like quarter note, eighth note, etc.
									grace_curr.type = notes[note_index].type[0];
								}
							}
							// Could add more here (e.g., about stems and beams).
							
							// Notations.
							if (notes[note_index].notations){
								var notations = {};
								// Slurs.
								if (notes[note_index].notations[0].slur){
									var slur_arr = notes[note_index].notations[0].slur;
									// console.log('slur:');
									// console.log(slur_arr);
									var slur = [];
									for (islur = 0; islur < slur_arr.length; islur++){
										slur_curr = {};
										slur_curr.number = parseInt(slur_arr[islur].$.number);
										slur_curr.type = slur_arr[islur].$.type;
										slur.push(slur_curr);
									}
									notations.slur = slur;
								}
								
								// Assign the notations field to note_curr.
								grace_curr.notations = notations;
							}
							
							grace_array.push(grace_curr);
						}
          }
        }
      }
    }
		// Associate grace notes with the appropriate ordinary notes.
		var notes_and_tied = assoc_grace(notes_array, tied_array, grace_array);
		notes_array = notes_and_tied[0];
		tied_array = notes_and_tied[1];
		
		// Resolve ties and concatenate them with ordinary notes.
		notes_and_tied = notes_array.concat(
			resolve_ties(tied_array.sort(util.sort_points_asc)));
		json_score.notes = notes_and_tied.sort(util.sort_points_asc);
    
		// json_score.notes = notes_array.sort(util.sort_points_asc); 
		// json_score.ties = tied_array.sort(util.sort_points_asc);
		json_score.rests = rests_array.sort(util.sort_points_asc);
		// json_score.grace = grace_array;
		// Include a default tempo if tempo_changes is empty or if no tempo is
		// specified at the beginning of the piece.
		if (tempo_changes.length == 0 || tempo_changes[0].ontime > 0){
			if (anacrusis == 0){
				tempo_changes.unshift({
					"barOn": 1, "beatOn": 1, "ontime": 0, "bpm": 84,
					"tempo": "Default tempo" });
			}
			else{
				var tempo_bar_beat =
				util.bar_and_beat_number_of_ontime(anacrusis, time_sig_array);
				tempo_changes.unshift({
					"barOn": 0,
					"beatOn": tempo_bar_beat[1],
					"ontime": anacrusis, "bpm": 84, "tempo": "Default tempo" });
			}
			
		}
		// Remove duplicate clef changes.
		json_score.clefChanges = util.remove_duplicate_clef_changes(clef_changes);
		// Append expressions array.
		json_score.expressions = util.resolve_expressions(xprss_array);
		// Append sequencing commands array.
		json_score.sequencing = sequencing;
    // Append page_layout variable.
		json_score.pageLayout = page_layout;
		// Append some miscellaneous information.
		json_score.miscXML = { "divisions": divisions, "anacrusis": anacrusis };
		// console.log('HERE')
    // return json_score;
    //console.log(json_score)
		callback(json_score);
		
	});
	
}


function resolve_ties(ties){
	// Tom Collins 24/11/2014.
  // This function takes note objects that are the beginning of tied events,
	// part way through tied events, or the end of tied events. It joins these
	// together into one summary note for the purposes of oblong (piano-roll)
	// display, but saves the details of the tie information in a property called
	// ties. It can be assumed that the ties variable is in ascending
	// lexicographic order.
	
	// Create a variable that contains all the tie start events.
	var tie_starts = [];
	for (inote = ties.length - 1; inote >= 0; inote--){
		if (ties[inote].tieType == 'start'){
			tie_starts.unshift(ties[inote]);
			ties.splice(inote, 1);
		}
	}
	// console.log('tie_starts:');
	// console.log(tie_starts);
	// console.log('ties:');
	// console.log(ties);
	
	// Loop over tie_starts, resolve the ties for each element, and compile them
	// within notes.
	var notes = [];
	for (itie = 0; itie < tie_starts.length; itie++){
		var tie_start = tie_starts[itie];
		// First define the note/oblong, which will summarise all the tied events
		// for this pitch.
		var note = {};
		for (var key in tie_start){
			if (key != 'tieType' && key != 'intDur' && key != 'accidental' &&
					key != 'type' && key != 'timeMod' && key != 'stem' &&
					key != 'beam' && key != 'notations' && key != 'grace'){
				note[key] = tie_start[key];
			}
		}
		
		// if (itie <= 3){
		// 	console.log('starting note:');
		// 	console.log(itie);
		// 	console.log('note:');
		// 	console.log(note);
		// }
		
		// Find all events involved in the tie.
		var tie = [];
		tie[0] = tie_start;
		var idxs_to_remove = [];
		var inote = 0;
		while (inote < ties.length){
			
			// if (itie <= 3 && ties[inote].pitch == 'C5'){
			// 	console.log('starting note:');
			// 	console.log(itie);
			// 	console.log('early C5 is amongst the ties:');
			// 	console.log(inote);
			// 	console.log('ties[inote]:');
			// 	console.log(ties[inote]);
			// }
			
			if (ties[inote].pitch == note.pitch &&
					ties[inote].staffNo == note.staffNo){
				tie.push(ties[inote]);
				idxs_to_remove.push(inote);
				if (ties[inote].tieType == 'stop'){
					inote = ties.length - 1;
				}
			}
			inote=inote+1;
		}
		// Remove the discovered events.
		
		// if (itie <= 3){
		// 	console.log('which indices gets removed for this starting note?:');
		// 	console.log(idxs_to_remove);
		// 	console.log('ties pre-splicing:');
		// 	console.log(ties.slice(0, 3));
		// }
		
		for (idx = idxs_to_remove.length - 1; idx >= 0; idx--){
			ties.splice(idxs_to_remove[idx], 1);
		}
		
		// if (itie <= 3){
		// 	console.log('ties post-splicing:');
		// 	console.log(ties.slice(0, 3));
		// }
		
		// Update the barOff, beatOff, offtime, and duration of the summary oblong.
		if (tie.length > 0 &&
				tie[tie.length - 1].tieType == 'stop'){
			// There was a completion to this tie.
			note.barOff = tie[tie.length - 1].barOff;
			note.beatOff = tie[tie.length - 1].beatOff;
			note.offtime = tie[tie.length - 1].offtime;
			// This is duration in crotchet beats rounded to 5 decimal places.
			note.duration = Math.round((note.offtime - note.ontime)*100000)/100000;
			// Legacy version in operation from November 2014 to August 2015
			// that did not handle tuplets properly (led to rounding errors).
			// note.duration = note.offtime - note.ontime;
			note.tie = tie;
		}
		else{
			// There was not a completion to this tie.
			console.log('There was not a completion to tied note event ID: '
									+ note.ID);
		}
		notes.push(note);
	}
	
	return notes;
}
exports.resolve_ties = resolve_ties;

// Example:
//var ties = [{"ID": "5", "pitch": "F#5", "MNN": 78, "MPN": 70, "barOn": 1,
//             "beatOn": 1, "ontime": 0, "duration": 3, "barOff": 2,
//						 "beatOff": 1, "offtime": 3, "staffNo": 0, "voiceNo": 1,
//						 "tieType": "start"},
//						 {"ID": "10", "pitch": "F#5", "MNN": 78, "MPN": 70, "barOn": 2,
//						 "beatOn": 1, "ontime": 3, "duration": 3, "barOff": 3,
//						 "beatOff": 1, "offtime": 6, "staffNo": 0, "voiceNo": 1,
//						 "tieType": "stop and start"},
//						 {"ID": "12", "pitch": "F#5", "MNN": 78, "MPN": 70, "barOn": 3,
//						  "beatOn": 1, "ontime": 6, "duration": 1, "barOff": 3,
//							"beatOff": 2, "offtime": 7, "staffNo": 0, "voiceNo": 1,
//							"tieType": "stop"},
//						 {"ID": "18", "pitch": "D5", "MNN": 74, "MPN": 68, "barOn": 4,
//						  "beatOn": 2, "ontime": 10, "duration": 2, "barOff": 5,
//						  "beatOff": 1, "offtime": 12, "staffNo": 0, "voiceNo": 1,
//						  "tieType": "start"},
//						 {"ID": "23", "pitch": "D5", "MNN": 74, "MPN": 68, "barOn": 5,
//						  "beatOn": 1, "ontime": 12, "duration": 1, "barOff": 5,
//							"beatOff": 2, "offtime": 13, "staffNo": 0, "voiceNo": 1,
//							"tieType": "stop"}];
//var ans = resolve_ties(ties);
//console.log(ans); // Should give:
//[{"ID": "5", "pitch": "F#5", "MNN": 78, "MPN": 70, "barOn": 1, "beatOn": 1,
//  "ontime": 0, "duration": 7, "barOff": 3, "beatOff": 2, "offtime": 7,
//  "staffNo": 0, "voiceNo": 1,
//  "tie": [{"ID": "5", "pitch": "F#5", "MNN": 78, "MPN": 70, "barOn": 1,
//				   "beatOn": 1, "ontime": 0, "duration": 3, "barOff": 2, "beatOff": 1,
//					 "offtime": 3, "staffNo": 0, "voiceNo": 1, "tieType": "start"},
//				  {"ID": "10", "pitch": "F#5", "MNN": 78, "MPN": 70, "barOn": 2,
//				   "beatOn": 1, "ontime": 3, "duration": 3, "barOff": 3, "beatOff": 1,
//					 "offtime": 6, "staffNo": 0, "voiceNo": 1,
//					 "tieType": "stop and start"},
//				  {"ID": "12", "pitch": "F#5", "MNN": 78, "MPN": 70, "barOn": 3,
//				   "beatOn": 1, "ontime": 6, "duration": 1, "barOff": 3, "beatOff": 2,
//					 "offtime": 7, "staffNo": 0, "voiceNo": 1, "tieType": "stop"}]},
// {"ID": "18", "pitch": "D5", "MNN": 74, "MPN": 68, "barOn": 4, "beatOn": 2,
//  "ontime": 10, "duration": 2, "barOff": 5, "beatOff": 1, "offtime": 12,
//  "staffNo": 0, "voiceNo": 1,
//  "tie": [{"ID": "18", "pitch": "D5", "MNN": 74, "MPN": 68, "barOn": 4,
//				   "beatOn": 2, "ontime": 10, "duration": 2, "barOff": 5, "beatOff": 1,
//				   "offtime": 12, "staffNo": 0, "voiceNo": 1, "tieType": "start"},
//				  {"ID": "23", "pitch": "D5", "MNN": 74, "MPN": 68, "barOn": 5,
//				   "beatOn": 1, "ontime": 12, "duration": 1, "barOff": 5, "beatOff": 2,
//					 "offtime": 13, "staffNo": 0, "voiceNo": 1, "tieType": "stop"}]}]


function assoc_grace(notes_array, tied_array, grace_array){
	// Tom Collins 18/2/2015.
  // This function groups an array of grace notes by their ID field, and then
	// it attaches this group of grace notes to a field of the ordinary note
	// whose ID field is one greater than the ID field of the final grace note in
	// each group. In this way, grace notes should be associated with the
	// appropriate ordinary notes to which they are attached in a score. If a
	// grace note is associated with a note that ties to subsequent notes, then
	// the grace field will appear within the tied note object, rather than
	// directly in the oblong summary.
	
	var ga = util.group_grace_by_contiguous_ID(grace_array);
	for (gi = 0; gi < ga.length; gi++){
		var target_ID = parseFloat(ga[gi][ga[gi].length - 1].ID) + 1;
		var target_idx = aro.arrayObjectIndexOf(notes_array, target_ID.toString(), "ID");
		if (target_idx >= 0){
			notes_array[target_idx].grace = ga[gi];
		}
		else{
			// Search for the note in the tied array instead.
			target_idx = aro.arrayObjectIndexOf(tied_array, target_ID.toString(), "ID");
			if (target_idx >= 0){
				tied_array[target_idx].grace = ga[gi];
			}
			else{
				console.log('Issue whilst assigning grace notes to ordinary notes:');
				console.log('Could not locate ordinary note with ID: ' + target_ID);
				console.log('Associated grace note(s) will be omitted from the json_score variable.');
			}
		}
	}
	return [notes_array, tied_array];
}
exports.assoc_grace = assoc_grace;

// Example:
//var notes_array = [
//  {"ID": "30", "pitch": "G3", "MNN": 55, "MPN": 57},
//  {"ID": "17", "pitch": "G3", "MNN": 55, "MPN": 57},
//  {"ID": "14", "pitch": "G3", "MNN": 55, "MPN": 57}];
//var tied_array = [];
//var grace_array = [
//  {"ID": "28", "pitch": "D4", "MNN": 62, "MPN": 61},
//  {"ID": "29", "pitch": "Bb3", "MNN": 58, "MPN": 59},
//  {"ID": "15", "pitch": "C4", "MNN": 60, "MPN": 60}];
//var ans = assoc_grace(notes_array, tied_array, grace_array);
//console.log(ans); // Should give:
//[{"ID": "30", "pitch": "G3", "MNN": 55, "MPN": 57,
//  "grace": [{"ID": "28", "pitch": "D4", "MNN": 62, "MPN": 61},
//						{"ID": "29", "pitch": "Bb3", "MNN": 58, "MPN": 59}]},
//	{"ID": "17", "pitch": "G3", "MNN": 55, "MPN": 57},
//  {"ID": "14", "pitch": "G3", "MNN": 55, "MPN": 57}].


function xml_pitch2pitch_class_and_octave(xml_pitch){
	// Tom Collins 24/11/2014.
  // This function converts an array object that contains pitch information
	// imported directly from a MusicXML file into a string containing the pitch
	// class of a note and its octave.
	
	var step = xml_pitch.step[0];
	if (xml_pitch.alter){
		var alter = xml_pitch.alter[0];
	}
	else{
		var alter = undefined;
	}
	var octave = xml_pitch.octave[0];
	//console.log(step);
	//console.log(alter);
	//console.log(octave);
	var final_pitch_str;
	var final_pitch;
	if (alter !== undefined){
		
		switch(alter){
			case '-2':
				final_pitch_str = '"' + step + 'bb' + octave + '"';
				final_pitch = step + 'bb' + octave;
				break;
			case '-1':
				final_pitch_str = '"' + step + 'b' + octave + '"';
				final_pitch = step + 'b' + octave;
				break;
			case '1':
				final_pitch_str = '"' + step + '#' + octave + '"';
				final_pitch = step + '#' + octave;
				break;
			case '2':
				final_pitch_str = '"' + step + '##' + octave + '"';
				final_pitch = step + '##' + octave;
				break;
		}
	}
	else {
		final_pitch_str = '"' + step + octave + '"';
		final_pitch = step + octave;
	}
	return final_pitch;
}
exports.xml_pitch2pitch_class_and_octave = xml_pitch2pitch_class_and_octave;

// Example:
// var xml_pitch = {"step": ["D"], "alter": [1], "octave": [4]};
// var ans = xml_pitch2pitch_class_and_octave(xml_pitch);
// console.log(ans); // Should give "D#4".




