

exports.pitch_and_octave_to_midi_note_morphetic_pair = function pitch_and_octave_to_midi_note_morphetic_pair(pitch_and_octave){
   // Tom Collins 15/10/2014.
   // This function converts a string consisting of a note's pitch and
   // octave into a  pair consisting of a MIDI note number and a morphetic
   // pitch number.

   var length_arg = pitch_and_octave.length;
   var pitch_class = pitch_and_octave.slice(0, length_arg - 1);
   var octave = pitch_and_octave[length_arg - 1];
   var pitch_class_lookup_array = new Array;
   pitch_class_lookup_array = [[[12, 6], "B#"], [[0, 0], "C"], [[0, 1], "Dbb"],
                              [[13, 6], "B##"], [[1, 0], "C#"], [[1, 1], "Db"],
                              [[2, 0], "C##"], [[2, 1], "D"], [[2, 2], "Ebb" ],
                              [[3, 1], "D#"], [[3, 2], "Eb"], [[4, 1], "D##"],
                              [[4, 2], "E"], [[3, 3], "Fbb"], [[5, 2], "E#"],
                              [[5, 3], "F"], [[5, 4], "Gbb"], [[6, 2], "E##"],
                              [[6, 3], "F#"], [[6, 4], "Gb"], [[7, 3], "F##"],
                              [[7, 4], "G"], [[7, 5], "Abb"], [[8, 4], "G#"],
                              [[8, 5], "Ab"], [[9, 4], "G##"], [[9, 5], "A"],
                              [[9, 6], "Bbb"], [[-2, 0], "Cbb"],
                              [[10, 5], "A#"], [[10, 6], "Bb"],
                              [[11, 5], "A##"], [[11, 6], "B"],
                              [[-1, 0], "Cb"]];
   var pitch_class_idx = 1;
   var n = pitch_class_lookup_array.length;
   var i = 0;
   while (i < n){
      if (pitch_class == pitch_class_lookup_array[i][1]){
         pitch_class_idx = i;
         i = n - 1;
      }
      i=i+1;
   }
   var midi_mpn_residue = pitch_class_lookup_array[pitch_class_idx][0];
   var a = new Array;
   a[0] = 12*octave + 12 + midi_mpn_residue[0];
   a[1] = 7*octave + 32 + midi_mpn_residue[1];
   // a.pitch = pitch_class_lookup_array[pitch_class_idx][1];
   // console.log("This is a test of pitch_and_octave_to_midi_note_morphetic_pair:");
   // console.log(a);
   return a;

};

exports.append_ontimes_to_time_signatures
  = function append_ontimes_to_time_signatures(
    time_sigs_array, crotchets_per_bar){
   // Tom Collins 26/2/2015.
   // This function appends ontimes to rows of the time-signature table. Added
   // an optional argument crotchets_per_bar, so that in the event of an
   // anacrusis, the first bar is assigned the correct ontime.
   
   if (crotchets_per_bar == undefined){
     var ontime = 0;
   }
   else{
     var ontime = -crotchets_per_bar;
   }
   time_sigs_array[0]["ontime"] = ontime;
   var i = 1;
   var n = time_sigs_array.length;
   while (i < n) {
      var c = (time_sigs_array[i]["barNo"] - time_sigs_array[i - 1]["barNo"])*time_sigs_array[i - 1]["topNo"]*
      4/time_sigs_array[i - 1]["bottomNo"];
      var d = time_sigs_array[i - 1]["ontime"] + c;
      time_sigs_array[i]["ontime"] = d;
      i=i+1;
   }
   a = time_sigs_array;
   // console.log("This is a test of append_ontimes_to_time_signatures:");
   // Answer should be:
   //[{ "barNo":1, "topNo":2, "bottomNo":4, "ontime":0 },
   // { "barNo":2, "topNo":3, "bottomNo":8, "ontime":2 },
   // { "barNo":4, "topNo":3, "bottomNo":4, "ontime":5 },
   // { "barNo":7, "topNo":5, "bottomNo":8, "ontime":14 }]
   // console.log(a);
   return a;
};

// var test_time_sigs = [{ "barNo":1, "topNo":2, "bottomNo":4 },
//                                  { "barNo":2, "topNo":3, "bottomNo":8 },
//                                  { "barNo":4, "topNo":3, "bottomNo":4 },
//                                  { "barNo":7, "topNo":5, "bottomNo":8 }];


// append_ontimes_to_time_signatures(test_time_sigs)


function guess_morphetic_in_C_major(mnn){
  // Tom Collins 15/10/2014.
  // In
  // mnn Integer mandatory
  // Out Integer
  // This function takes a MIDI note number as its only argument. It
  // attempts to guess the corresponding morphetic pitch number, assuming
  // a key of or close to C major.

  // console.log('mnn:');
  // console.log(mnn);
  var octave = Math.floor(mnn/12 - 1);
  // console.log('mnn:');
  // console.log(mnn);
  // console.log('octave:');
  // console.log(octave);
  var midi_residue = mnn - 12*(octave + 1);
  // console.log('midi_residue:');
  // console.log(midi_residue);
  var midi_residue_lookup_array = [[0, 0], [1, 0], [2, 1], [3, 2],
                                   [4, 2], [5, 3], [6, 3], [7, 4],
                                   [8, 4], [9, 5], [10, 6], [11, 6]];
  var midi_residue_idx = 0;
  var n = midi_residue_lookup_array.length;
  var i = 0;
  while (i < n){
      if (midi_residue == midi_residue_lookup_array[i][0]){
          midi_residue_idx = i;
          i = n - 1;
      }
      i=i+1;
  }
  var mpn_residue = midi_residue_lookup_array[midi_residue_idx][1];
  // console.log('mpn_residue:');
  // console.log(mpn_residue);
  a = mpn_residue + 7*octave + 32;
  // console.log("This is a test of guess_morphetic_in_C_major:");
  // console.log(a);
  return a;
};


function guess_morphetic(mnn, fifth_steps, mode){
  // Tom Collins 15/10/2014.
  // In
  // mnn Integer mandatory
  // fifth_steps Integer mandatory
  // mode Integer mandatory
  // This function takes a MIDI note number and a key (represented by
  // steps on the circle of fiths, and mode). It attempts to guess the
  // corresponding morphetic pitch number, given the key.

  var fifth_steps_lookup_array = new Array;
  fifth_steps_lookup_array = [// Major keys.
                              [[-6, 0], 6, 4], [[-5, 0], -1, -1],
                              [[-4, 0], 4, 2], [[-3, 0], -3, -2],
                              [[-2, 0], 2, 1], [[-1, 0], -5, -3],
                              [[0, 0], 0, 0], [[1, 0], 5, 3],
                              [[2, 0], -2, -1], [[3, 0], 3, 2],
                              [[4, 0], -4, -2], [[5, 0], 1, 1],
                              [[6, 0], -6, -4],
                              // Minor keys.
                              [[-3, 5], 6, 4], [[-2, 5], -1, -1],
                              [[-1, 5], 4, 2], [[0, 5], -3, -2],
                              [[1, 5], 2, 1], [[2, 5], -5, -3],
                              [[3, 5], 0, 0], [[4, 5], 5, 3],
                              [[5, 5], -2, -1], [[6, 5], 3, 2],
                              [[-6, 5], 3, 2], [[7, 5], -4, -2],
                              [[-5, 5], -4, -2], [[8, 5], 1, 1],
                              [[-4, 5], 1, 1], [[9, 5], -6, -4]];
  var fifth_steps_idx = 0;
  var n = fifth_steps_lookup_array.length;
  var i = 0;
  while (i < n){
      if (fifth_steps == fifth_steps_lookup_array[i][0][0] &&
              mode == fifth_steps_lookup_array[i][0][1]){
          fifth_steps_idx = i;
          i = n - 1;
      }
      i=i+1;
  }
  var trans = fifth_steps_lookup_array[fifth_steps_idx].slice(1);
  // console.log('trans:');
  // console.log(trans);
  var z = mnn + trans[0];
  // console.log('z:');
  // console.log(z);
  var w = guess_morphetic_in_C_major(z);
  // console.log('w:');
  // console.log(w);
  var a = w - trans[1];
  // console.log("This is a test of guess_morphetic:");
  // console.log(a);
  return a;
};
exports.guess_morphetic = guess_morphetic;

//// Example 1:
//var mnn = 54;
//var fifth_steps = 4;
//var mode = 5;
//var ans1 = guess_morphetic(mnn, fifth_steps, mode);
//console.log('ans1 = ' + ans1); // Should give 56.
//// Example 2:
//mnn = 67;
//fifth_steps = 5;
//mode = 0;
//var ans2 = guess_morphetic(mnn, fifth_steps, mode);
//console.log('ans2 = ' + ans2); // Should give 64.

function row_of_max_bar_leq_bar_arg(bar, time_sigs_array){
   // Tom Collins 17/10/2014.
   // This function returns the row (in a list of time signatures) of the
   // maximal bar number less than or equal to the bar number argument.

   var bar_out = time_sigs_array[0];
   var i = 0;
   var n = time_sigs_array.length;
   while (i < n) {
      if (bar < time_sigs_array[i]["barNo"]){
         bar_out = time_sigs_array[i - 1];
         i = n - 1;
      }
      else if (bar == time_sigs_array[0]["barNo"]){
            bar_out = time_sigs_array[i];
            i = n - 1;
      }
      else if (i == n - 1){
         bar_out = time_sigs_array[i];
      }
      i=i+1;
   }
   // console.log("This is a test of row_of_max_bar_leq_bar_arg:");
   // Answer should be:
   // [{ "barNo":4, "topNo":3, "bottomNo":4, "ontime":5 }]
   // console.log(a);
   return bar_out;
};
exports.row_of_max_bar_leq_bar_arg = row_of_max_bar_leq_bar_arg;

// row_of_max_bar_leq_bar_arg(5,
   // [{ "barNo":1, "topNo":2, "bottomNo":4, "ontime":0 },
   //  { "barNo":2, "topNo":3, "bottomNo":8, "ontime":2 },
   //  { "barNo":4, "topNo":3, "bottomNo":4, "ontime":5 },
   //  { "barNo":7, "topNo":5, "bottomNo":8, "ontime":14 }])


function row_of_max_ontime_leq_ontime_arg(ontime, time_sigs_array){
   // Tom Collins 17/10/2014.
   // This function returns the row (in a list of time signatures) of the
   // maximal ontime less than or equal to the ontime argument.
   
   var ontime_out = time_sigs_array[0];
   var i = 0;
   var n = time_sigs_array.length;
   while (i < n) {
      if (ontime < time_sigs_array[i]["ontime"]){
         ontime_out = time_sigs_array[i - 1];
         i = n - 1;
      }
      else if (ontime == time_sigs_array[0]["ontime"]){
            ontime_out = time_sigs_array[i];
            i = n - 1;
      }
      else if (i == n - 1){
         ontime_out = time_sigs_array[i];
      }
      i=i+1;
   }
   a = ontime_out;
   // console.log("This is a test of row_of_max_ontime_leq_ontime_arg:");
   // Answer should be:
   // [{ "barNo":4, "topNo":3, "bottomNo":4, "ontime":5 }]
   // console.log(a);
   return a;
};
exports.row_of_max_ontime_leq_ontime_arg = row_of_max_ontime_leq_ontime_arg;

// row_of_max_ontime_leq_ontime_arg(5,
// [{ "barNo":1, "topNo":2, "bottomNo":4, "ontime":0 },
//  { "barNo":2, "topNo":3, "bottomNo":8, "ontime":2 },
//  { "barNo":4, "topNo":3, "bottomNo":4, "ontime":5 },
//  { "barNo":7, "topNo":5, "bottomNo":8, "ontime":14 }])
/*var ans = row_of_max_bar_leq_bar_arg(5,
   [{
            "barNo": 0,
            "ontime": -4,
            "clef": "treble clef",
            "clefSign": "G",
            "clefLine": 2,
            "staffNo": 0
        },
        {
            "barNo": 4,
            "ontime": 12,
            "clef": "bass clef",
            "clefSign": "F",
            "clefLine": 4,
            "staffNo": 0
        },
        {
            "barNo": 6,
            "ontime": 20,
            "clef": "treble clef",
            "clefSign": "G",
            "clefLine": 2,
            "staffNo": 0
        }]);
console.log(ans);*/ // Should give:
//{ "barNo": 4, "ontime": 12, "clef": "bass clef", "clefSign": "F",
//  "clefLine": 4, "staffNo": 0 }

exports.ontime_of_bar_and_beat_number = function ontime_of_bar_and_beat_number(bar, beat, time_sigs_array){
   // Tom Collins 17/10/2014.
   // Given a bar and beat number, and a time-signature table (with ontimes
   // appended), this function returns the ontime of that bar and beat
   // number.

   var n = time_sigs_array.length;
   var relevant_row = row_of_max_bar_leq_bar_arg(bar, time_sigs_array);
   var excess = bar - relevant_row["barNo"];
   var local_beat_bar = relevant_row["topNo"]*4/relevant_row["bottomNo"];
   a = relevant_row["ontime"] + excess*local_beat_bar + beat - 1;
   // console.log("This is a test of ontime_of_bar_and_beat_number:");
   // Answer should be 4.
   // console.log(a);
   return a;
};

// ontime_of_bar_and_beat_number(3, 1.5,
//    [{ "barNo":1, "topNo":2, "bottomNo":4, "ontime":0 },
//     { "barNo":2, "topNo":3, "bottomNo":8, "ontime":2 },
//     { "barNo":4, "topNo":3, "bottomNo":4, "ontime":5 },
//     { "barNo":7, "topNo":5, "bottomNo":8, "ontime":14 }])


exports.bar_and_beat_number_of_ontime = function bar_and_beat_number_of_ontime(ontime, time_sigs_array){
   // Tom Collins 17/10/2014.
   // Given an ontime and a time-signature table (with ontimes appended),
   // this function returns the bar number and beat number of that ontime.
   
   var n = time_sigs_array.length;
   var relevant_row = row_of_max_ontime_leq_ontime_arg(ontime, time_sigs_array);
   if (ontime >= 0) {
      var excess = ontime - relevant_row["ontime"];
      var local_beat_bar = relevant_row["topNo"]*4/relevant_row["bottomNo"];
      a = [relevant_row["barNo"] + Math.floor(excess/local_beat_bar),
             (excess % local_beat_bar) + 1];
   }
   else {
      var anacrusis_beat = time_sigs_array[0]["topNo"] + ontime + 1;
      a = [0, anacrusis_beat];
   }
   // console.log("This is a test of bar_and_beat_number_of_ontime:");
   // Answer should be [3, 1].
   // console.log(a);
   return a;
};


exports.sort_points_asc = function sort_points_asc(a, b){
	// A helper function, to sort two notes (points) or rests by ascending ontime.
	// If the ontimes match and MNNs are defined, sort by these instead. If these
	// match, sort by staffNo. If these match, sort by voiceNo.
	if (a.ontime != b.ontime){
    return a.ontime - b.ontime;
	}
	if (a.MNN != undefined){
		if (a.MNN != b.MNN){
			return a.MNN - b.MNN;
		}
	}
	if (a.staffNo != b.staffNo){
		return a.staffNo - b.staffNo;
	}
	return a.voiceNo - b.voiceNo;
}


function sort_points_asc_by_ID(a, b){
  // Tom Collins 18/2/2015.
	// A helper function, to sort two notes (points) or rests ascending by their
  // ID field.
  
  var c = a.ID;
  var d = b.ID;
  if (typeof c == "string"){
    c = parseFloat(c);
  }
  if (typeof d == "string"){
    d = parseFloat(d);
  }
	return c - d;
}
exports.sort_points_asc_by_ID = sort_points_asc_by_ID;

// Example:
// var arr1 = [{"ID": "14.2"}, {"ID": "14.1"}];
// var arr2 = arr1.sort(sort_points_asc_by_ID);
// console.log(arr2); // Should give [{"ID": "14.1"}, {"ID": "14.2"}].


function group_grace_by_contiguous_ID(grace_array){
  // Tom Collins 18/2/2015.
	// An array of grace notes is the input to this function. The function groups
  // these grace notes into new arrays whose membership is determined by
  // contiguity of the ID fields. This is to make sure that if several grace
  // notes precede an ordinary note, these are grouped together and (later)
  // attached to this ordinary note.
  
  var ga = grace_array.sort(sort_points_asc_by_ID);
  if (ga.length > 0){
    var gag = [[ga[0]]];
    var gj = 0;
    for (gi = 1; gi < ga.length; gi++){
      if (parseFloat(ga[gi].ID) ==
          parseFloat(gag[gj][gag[gj].length - 1].ID) + 1){
        gag[gj].push(ga[gi]);
      }
      else{
        gag.push([ga[gi]]);
        gj++;
      }
    }
  }
  else{
    var gag = [];
  }
  return gag;
}
exports.group_grace_by_contiguous_ID = group_grace_by_contiguous_ID;

// Example:
//var grace_array = [
//  {"ID": "28", "pitch": "D4", "MNN": 62, "MPN": 61},
//  {"ID": "29", "pitch": "Bb3", "MNN": 58, "MPN": 59},
//  {"ID": "15", "pitch": "G3", "MNN": 55, "MPN": 57}];
//var ans = group_grace_by_contiguous_ID(grace_array);
//console.log(ans); // Should give:
//[[{"ID": "15", "pitch": "G3", "MNN": 55, "MPN": 57}],
// [{"ID": "28", "pitch": "D4", "MNN": 62, "MPN": 61},
//  {"ID": "29", "pitch": "Bb3", "MNN": 58, "MPN": 59}]].

function nos_symbols_and_mode2key_name(nos_symbols, mode){
  // Tom Collins 19/2/2015.
	// This function takes the number of symbols in a key signature and a string
  // specifying the mode, and converts these pieces of information to a string
  // naming the key signature. For instance, -2 symbols means 2 flats, and
  // aeolian mode would give G aeolian. It should be extended to handle more
  // modal names, such as D dorian.
  
  // console.log('Debug key:');
  // console.log(nos_symbols);
  // console.log(mode);
  var lookup = [{"nosSymbols": 0, "mode": "major", "keyName": "C major"},
								{"nosSymbols": 1, "mode": "major", "keyName": "G major"},
								{"nosSymbols": 2, "mode": "major", "keyName": "D major"},
								{"nosSymbols": 3, "mode": "major", "keyName": "A major"},
								{"nosSymbols": 4, "mode": "major", "keyName": "E major"},
								{"nosSymbols": 5, "mode": "major", "keyName": "B major"},
								{"nosSymbols": 6, "mode": "major", "keyName": "F# major"},
								{"nosSymbols": 7, "mode": "major", "keyName": "C# major"},
								{"nosSymbols": 8, "mode": "major", "keyName": "G# major"},
								{"nosSymbols": 9, "mode": "major", "keyName": "D# major"},
								{"nosSymbols": 10, "mode": "major", "keyName": "A# major"},
								{"nosSymbols": 11, "mode": "major", "keyName": "E# major"},
								{"nosSymbols": -1, "mode": "major", "keyName": "F major"},
								{"nosSymbols": -2, "mode": "major", "keyName": "Bb major"},
								{"nosSymbols": -3, "mode": "major", "keyName": "Eb major"},
								{"nosSymbols": -4, "mode": "major", "keyName": "Ab major"},
								{"nosSymbols": -5, "mode": "major", "keyName": "Db major"},
								{"nosSymbols": -6, "mode": "major", "keyName": "Gb major"},
								{"nosSymbols": -7, "mode": "major", "keyName": "Cb major"},
								{"nosSymbols": -8, "mode": "major", "keyName": "Fb major"},
								{"nosSymbols": -9, "mode": "major", "keyName": "Bbb major"},
								{"nosSymbols": -10, "mode": "major", "keyName": "Ebb major"},
								{"nosSymbols": -11, "mode": "major", "keyName": "Abb major"},
								{"nosSymbols": 0, "mode": "minor", "keyName": "A minor"},
								{"nosSymbols": 1, "mode": "minor", "keyName": "E minor"},
								{"nosSymbols": 2, "mode": "minor", "keyName": "B minor"},
								{"nosSymbols": 3, "mode": "minor", "keyName": "F# minor"},
								{"nosSymbols": 4, "mode": "minor", "keyName": "C# minor"},
								{"nosSymbols": 5, "mode": "minor", "keyName": "G# minor"},
								{"nosSymbols": 6, "mode": "minor", "keyName": "D# minor"},
								{"nosSymbols": 7, "mode": "minor", "keyName": "A# minor"},
								{"nosSymbols": 8, "mode": "minor", "keyName": "E# minor"},
								{"nosSymbols": 9, "mode": "minor", "keyName": "B# minor"},
								{"nosSymbols": 10, "mode": "minor", "keyName": "F## minor"},
								{"nosSymbols": 11, "mode": "minor", "keyName": "C## minor"},
								{"nosSymbols": -1, "mode": "minor", "keyName": "D minor"},
								{"nosSymbols": -2, "mode": "minor", "keyName": "G minor"},
								{"nosSymbols": -3, "mode": "minor", "keyName": "C minor"},
								{"nosSymbols": -4, "mode": "minor", "keyName": "F minor"},
								{"nosSymbols": -5, "mode": "minor", "keyName": "Bb minor"},
								{"nosSymbols": -6, "mode": "minor", "keyName": "Eb minor"},
								{"nosSymbols": -7, "mode": "minor", "keyName": "Ab minor"},
								{"nosSymbols": -8, "mode": "minor", "keyName": "Db minor"},
								{"nosSymbols": -9, "mode": "minor", "keyName": "Gb minor"},
								{"nosSymbols": -10, "mode": "minor", "keyName": "Cb minor"},
								{"nosSymbols": -11, "mode": "minor", "keyName": "Fb minor"},
                {"nosSymbols": 0, "mode": "ionian", "keyName": "C ionian"},
								{"nosSymbols": 1, "mode": "ionian", "keyName": "G ionian"},
								{"nosSymbols": 2, "mode": "ionian", "keyName": "D ionian"},
								{"nosSymbols": 3, "mode": "ionian", "keyName": "A ionian"},
								{"nosSymbols": 4, "mode": "ionian", "keyName": "E ionian"},
								{"nosSymbols": 5, "mode": "ionian", "keyName": "B ionian"},
								{"nosSymbols": 6, "mode": "ionian", "keyName": "F# ionian"},
								{"nosSymbols": 7, "mode": "ionian", "keyName": "C# ionian"},
								{"nosSymbols": 8, "mode": "ionian", "keyName": "G# ionian"},
								{"nosSymbols": 9, "mode": "ionian", "keyName": "D# ionian"},
								{"nosSymbols": 10, "mode": "ionian", "keyName": "A# ionian"},
								{"nosSymbols": 11, "mode": "ionian", "keyName": "E# ionian"},
								{"nosSymbols": -1, "mode": "ionian", "keyName": "F ionian"},
								{"nosSymbols": -2, "mode": "ionian", "keyName": "Bb ionian"},
								{"nosSymbols": -3, "mode": "ionian", "keyName": "Eb ionian"},
								{"nosSymbols": -4, "mode": "ionian", "keyName": "Ab ionian"},
								{"nosSymbols": -5, "mode": "ionian", "keyName": "Db ionian"},
								{"nosSymbols": -6, "mode": "ionian", "keyName": "Gb ionian"},
								{"nosSymbols": -7, "mode": "ionian", "keyName": "Cb ionian"},
								{"nosSymbols": -8, "mode": "ionian", "keyName": "Fb ionian"},
								{"nosSymbols": -9, "mode": "ionian", "keyName": "Bbb ionian"},
								{"nosSymbols": -10, "mode": "ionian", "keyName": "Ebb ionian"},
								{"nosSymbols": -11, "mode": "ionian", "keyName": "Abb ionian"},
                {"nosSymbols": 0, "mode": "dorian", "keyName": "D dorian"},
								{"nosSymbols": 1, "mode": "dorian", "keyName": "A dorian"},
								{"nosSymbols": 2, "mode": "dorian", "keyName": "E dorian"},
								{"nosSymbols": 3, "mode": "dorian", "keyName": "B dorian"},
								{"nosSymbols": 4, "mode": "dorian", "keyName": "F# dorian"},
								{"nosSymbols": 5, "mode": "dorian", "keyName": "C# dorian"},
								{"nosSymbols": 6, "mode": "dorian", "keyName": "G# dorian"},
								{"nosSymbols": 7, "mode": "dorian", "keyName": "D# dorian"},
								{"nosSymbols": 8, "mode": "dorian", "keyName": "A# dorian"},
								{"nosSymbols": 9, "mode": "dorian", "keyName": "E# dorian"},
								{"nosSymbols": 10, "mode": "dorian", "keyName": "B# dorian"},
								{"nosSymbols": 11, "mode": "dorian", "keyName": "F## dorian"},
								{"nosSymbols": -1, "mode": "dorian", "keyName": "G dorian"},
								{"nosSymbols": -2, "mode": "dorian", "keyName": "C dorian"},
								{"nosSymbols": -3, "mode": "dorian", "keyName": "F dorian"},
								{"nosSymbols": -4, "mode": "dorian", "keyName": "Bb dorian"},
								{"nosSymbols": -5, "mode": "dorian", "keyName": "Eb dorian"},
								{"nosSymbols": -6, "mode": "dorian", "keyName": "Ab dorian"},
								{"nosSymbols": -7, "mode": "dorian", "keyName": "Db dorian"},
								{"nosSymbols": -8, "mode": "dorian", "keyName": "Gb dorian"},
								{"nosSymbols": -9, "mode": "dorian", "keyName": "Cb dorian"},
								{"nosSymbols": -10, "mode": "dorian", "keyName": "Fb dorian"},
								{"nosSymbols": -11, "mode": "dorian", "keyName": "Bbb dorian"},
                {"nosSymbols": 0, "mode": "phrygian", "keyName": "E phrygian"},
								{"nosSymbols": 1, "mode": "phrygian", "keyName": "B phrygian"},
								{"nosSymbols": 2, "mode": "phrygian", "keyName": "F# phrygian"},
								{"nosSymbols": 3, "mode": "phrygian", "keyName": "C# phrygian"},
								{"nosSymbols": 4, "mode": "phrygian", "keyName": "G# phrygian"},
								{"nosSymbols": 5, "mode": "phrygian", "keyName": "D# phrygian"},
								{"nosSymbols": 6, "mode": "phrygian", "keyName": "A# phrygian"},
								{"nosSymbols": 7, "mode": "phrygian", "keyName": "E# phrygian"},
								{"nosSymbols": 8, "mode": "phrygian", "keyName": "B# phrygian"},
								{"nosSymbols": 9, "mode": "phrygian", "keyName": "F## phrygian"},
								{"nosSymbols": 10, "mode": "phrygian", "keyName": "C## phrygian"},
								{"nosSymbols": 11, "mode": "phrygian", "keyName": "G## phrygian"},
								{"nosSymbols": -1, "mode": "phrygian", "keyName": "A phrygian"},
								{"nosSymbols": -2, "mode": "phrygian", "keyName": "D phrygian"},
								{"nosSymbols": -3, "mode": "phrygian", "keyName": "G phrygian"},
								{"nosSymbols": -4, "mode": "phrygian", "keyName": "C phrygian"},
								{"nosSymbols": -5, "mode": "phrygian", "keyName": "F phrygian"},
								{"nosSymbols": -6, "mode": "phrygian", "keyName": "Bb phrygian"},
								{"nosSymbols": -7, "mode": "phrygian", "keyName": "Eb phrygian"},
								{"nosSymbols": -8, "mode": "phrygian", "keyName": "Ab phrygian"},
								{"nosSymbols": -9, "mode": "phrygian", "keyName": "Db phrygian"},
								{"nosSymbols": -10, "mode": "phrygian", "keyName": "Gb phrygian"},
								{"nosSymbols": -11, "mode": "phrygian", "keyName": "Cb phrygian"},
                {"nosSymbols": 0, "mode": "lydian", "keyName": "F lydian"},
								{"nosSymbols": 1, "mode": "lydian", "keyName": "C lydian"},
								{"nosSymbols": 2, "mode": "lydian", "keyName": "G lydian"},
								{"nosSymbols": 3, "mode": "lydian", "keyName": "D lydian"},
								{"nosSymbols": 4, "mode": "lydian", "keyName": "A lydian"},
								{"nosSymbols": 5, "mode": "lydian", "keyName": "E lydian"},
								{"nosSymbols": 6, "mode": "lydian", "keyName": "B lydian"},
								{"nosSymbols": 7, "mode": "lydian", "keyName": "F# lydian"},
								{"nosSymbols": 8, "mode": "lydian", "keyName": "C# lydian"},
								{"nosSymbols": 9, "mode": "lydian", "keyName": "G# lydian"},
								{"nosSymbols": 10, "mode": "lydian", "keyName": "D# lydian"},
								{"nosSymbols": 11, "mode": "lydian", "keyName": "A# lydian"},
								{"nosSymbols": -1, "mode": "lydian", "keyName": "Bb lydian"},
								{"nosSymbols": -2, "mode": "lydian", "keyName": "Eb lydian"},
								{"nosSymbols": -3, "mode": "lydian", "keyName": "Ab lydian"},
								{"nosSymbols": -4, "mode": "lydian", "keyName": "Db lydian"},
								{"nosSymbols": -5, "mode": "lydian", "keyName": "Gb lydian"},
								{"nosSymbols": -6, "mode": "lydian", "keyName": "Cb lydian"},
								{"nosSymbols": -7, "mode": "lydian", "keyName": "Fb lydian"},
								{"nosSymbols": -8, "mode": "lydian", "keyName": "Bbb lydian"},
								{"nosSymbols": -9, "mode": "lydian", "keyName": "Ebb lydian"},
								{"nosSymbols": -10, "mode": "lydian", "keyName": "Abb lydian"},
								{"nosSymbols": -11, "mode": "lydian", "keyName": "Dbb lydian"},
                {"nosSymbols": 0, "mode": "mixolydian", "keyName": "G mixolydian"},
								{"nosSymbols": 1, "mode": "mixolydian", "keyName": "D mixolydian"},
								{"nosSymbols": 2, "mode": "mixolydian", "keyName": "A mixolydian"},
								{"nosSymbols": 3, "mode": "mixolydian", "keyName": "E mixolydian"},
								{"nosSymbols": 4, "mode": "mixolydian", "keyName": "B mixolydian"},
								{"nosSymbols": 5, "mode": "mixolydian", "keyName": "F# mixolydian"},
								{"nosSymbols": 6, "mode": "mixolydian", "keyName": "C# mixolydian"},
								{"nosSymbols": 7, "mode": "mixolydian", "keyName": "G# mixolydian"},
								{"nosSymbols": 8, "mode": "mixolydian", "keyName": "D# mixolydian"},
								{"nosSymbols": 9, "mode": "mixolydian", "keyName": "A# mixolydian"},
								{"nosSymbols": 10, "mode": "mixolydian", "keyName": "E# mixolydian"},
								{"nosSymbols": 11, "mode": "mixolydian", "keyName": "B# mixolydian"},
								{"nosSymbols": -1, "mode": "mixolydian", "keyName": "C mixolydian"},
								{"nosSymbols": -2, "mode": "mixolydian", "keyName": "F mixolydian"},
								{"nosSymbols": -3, "mode": "mixolydian", "keyName": "Bb mixolydian"},
								{"nosSymbols": -4, "mode": "mixolydian", "keyName": "Eb mixolydian"},
								{"nosSymbols": -5, "mode": "mixolydian", "keyName": "Ab mixolydian"},
								{"nosSymbols": -6, "mode": "mixolydian", "keyName": "Db mixolydian"},
								{"nosSymbols": -7, "mode": "mixolydian", "keyName": "Gb mixolydian"},
								{"nosSymbols": -8, "mode": "mixolydian", "keyName": "Cb mixolydian"},
								{"nosSymbols": -9, "mode": "mixolydian", "keyName": "Fb mixolydian"},
								{"nosSymbols": -10, "mode": "mixolydian", "keyName": "Bbb mixolydian"},
								{"nosSymbols": -11, "mode": "mixolydian", "keyName": "Ebb mixolydian"},
                {"nosSymbols": 0, "mode": "aeolian", "keyName": "A aeolian"},
								{"nosSymbols": 1, "mode": "aeolian", "keyName": "E aeolian"},
								{"nosSymbols": 2, "mode": "aeolian", "keyName": "B aeolian"},
								{"nosSymbols": 3, "mode": "aeolian", "keyName": "F# aeolian"},
								{"nosSymbols": 4, "mode": "aeolian", "keyName": "C# aeolian"},
								{"nosSymbols": 5, "mode": "aeolian", "keyName": "G# aeolian"},
								{"nosSymbols": 6, "mode": "aeolian", "keyName": "D# aeolian"},
								{"nosSymbols": 7, "mode": "aeolian", "keyName": "A# aeolian"},
								{"nosSymbols": 8, "mode": "aeolian", "keyName": "E# aeolian"},
								{"nosSymbols": 9, "mode": "aeolian", "keyName": "B# aeolian"},
								{"nosSymbols": 10, "mode": "aeolian", "keyName": "F## aeolian"},
								{"nosSymbols": 11, "mode": "aeolian", "keyName": "C## aeolian"},
								{"nosSymbols": -1, "mode": "aeolian", "keyName": "D aeolian"},
								{"nosSymbols": -2, "mode": "aeolian", "keyName": "G aeolian"},
								{"nosSymbols": -3, "mode": "aeolian", "keyName": "C aeolian"},
								{"nosSymbols": -4, "mode": "aeolian", "keyName": "F aeolian"},
								{"nosSymbols": -5, "mode": "aeolian", "keyName": "Bb aeolian"},
								{"nosSymbols": -6, "mode": "aeolian", "keyName": "Eb aeolian"},
								{"nosSymbols": -7, "mode": "aeolian", "keyName": "Ab aeolian"},
								{"nosSymbols": -8, "mode": "aeolian", "keyName": "Db aeolian"},
								{"nosSymbols": -9, "mode": "aeolian", "keyName": "Gb aeolian"},
								{"nosSymbols": -10, "mode": "aeolian", "keyName": "Cb aeolian"},
								{"nosSymbols": -11, "mode": "aeolian", "keyName": "Fb aeolian"},
                {"nosSymbols": 0, "mode": "locrian", "keyName": "B locrian"},
								{"nosSymbols": 1, "mode": "locrian", "keyName": "F# locrian"},
								{"nosSymbols": 2, "mode": "locrian", "keyName": "C# locrian"},
								{"nosSymbols": 3, "mode": "locrian", "keyName": "G# locrian"},
								{"nosSymbols": 4, "mode": "locrian", "keyName": "D# locrian"},
								{"nosSymbols": 5, "mode": "locrian", "keyName": "A# locrian"},
								{"nosSymbols": 6, "mode": "locrian", "keyName": "E## locrian"},
								{"nosSymbols": 7, "mode": "locrian", "keyName": "B## locrian"},
								{"nosSymbols": 8, "mode": "locrian", "keyName": "F## locrian"},
								{"nosSymbols": 9, "mode": "locrian", "keyName": "C## locrian"},
								{"nosSymbols": 10, "mode": "locrian", "keyName": "G## locrian"},
								{"nosSymbols": 11, "mode": "locrian", "keyName": "D## locrian"},
								{"nosSymbols": -1, "mode": "locrian", "keyName": "E locrian"},
								{"nosSymbols": -2, "mode": "locrian", "keyName": "A locrian"},
								{"nosSymbols": -3, "mode": "locrian", "keyName": "D locrian"},
								{"nosSymbols": -4, "mode": "locrian", "keyName": "G locrian"},
								{"nosSymbols": -5, "mode": "locrian", "keyName": "C locrian"},
								{"nosSymbols": -6, "mode": "locrian", "keyName": "F locrian"},
								{"nosSymbols": -7, "mode": "locrian", "keyName": "Bb locrian"},
								{"nosSymbols": -8, "mode": "locrian", "keyName": "Eb locrian"},
								{"nosSymbols": -9, "mode": "locrian", "keyName": "Ab locrian"},
								{"nosSymbols": -10, "mode": "locrian", "keyName": "Db locrian"},
								{"nosSymbols": -11, "mode": "locrian", "keyName": "Gb locrian"}];
  var i = 0;
	while (i < lookup.length){
		if (lookup[i].nosSymbols == nos_symbols &&
				lookup[i].mode == mode){
			var key_name = lookup[i].keyName;
      i = lookup.length - 1;
		}
    i++;
	}
	if (key_name == undefined){
		return "not specified";
	}
	else{
		return key_name;
	}
}
exports.nos_symbols_and_mode2key_name = nos_symbols_and_mode2key_name;

// Example:
//var nos_symbols = -3;
//var mode = "minor";
//var ans = nos_symbols_and_mode2key_name(nos_symbols, mode);
//console.log(ans); // Should give "C minor".


function clef_sign_and_line2clef_name(sign, line, clef_octave_change){
  var lookup = [{"sign": "G", "line": 2, "name": "treble clef"},
                {"sign": "G", "line": 2, "clefOctaveChange": 1, "name": "treble clef 8va"},
                {"sign": "G", "line": 2, "clefOctaveChange": 2, "name": "treble clef 15ma"},
                {"sign": "G", "line": 2, "clefOctaveChange": -1, "name": "treble clef 8vb"},
                {"sign": "G", "line": 1, "name": "French violin clef"},
                {"sign": "C", "line": 1, "name": "soprano clef"},
                {"sign": "C", "line": 2, "name": "mezzo-soprano clef"},
                {"sign": "C", "line": 3, "name": "alto clef"},
                {"sign": "C", "line": 4, "name": "tenor clef"},
                {"sign": "C", "line": 4, "name": "baritone clef (C clef)"},
                {"sign": "F", "line": 4, "name": "bass clef"},
                {"sign": "F", "line": 4, "clefOctaveChange": 1, "name": "bass clef 8va"},
                {"sign": "F", "line": 4, "clefOctaveChange": 2, "name": "bass clef 15ma"},
                {"sign": "F", "line": 4, "clefOctaveChange": -1, "name": "bass clef 8vb"},
                {"sign": "F", "line": 4, "clefOctaveChange": -2, "name": "bass clef 15mb"},
                {"sign": "F", "line": 3, "name": "baritone clef (F clef)"},
                {"sign": "F", "line": 5, "name": "subbass clef 15mb"},
                // These last two do not seem to be supported.
                {"sign": "percussion", "line": 2, "name": "percussion clef"},
                {"sign": "TAB", "line": 0, "name": "tablature"}];
  var i = 0;
	while (i < lookup.length){
		if (lookup[i].sign == sign &&
				lookup[i].line == line &&
        (clef_octave_change == undefined ||
         lookup[i].clefOctaveChange &&
         lookup[i].clefOctaveChange == clef_octave_change)){
			var clef_name = lookup[i].name;
      i = lookup.length - 1;
		}
    i++;
	}
	if (clef_name == undefined){
		return "unknown";
	}
	else{
		return clef_name;
	}
}
exports.clef_sign_and_line2clef_name = clef_sign_and_line2clef_name;

// Example:
// var sign = "C";
// var line = 3;
// var ans = clef_sign_and_line2clef_name(sign, line);
// console.log(ans); // Should give "alto clef".


function staff_voice_xml2staff_voice_json(
  voice_no_from_xml, staff_nos_for_this_id, part_idx){
  // Tom Collins 22/2/2015.
	// This function converts MusicXML 2.0 voice assignments, which can go beyond
  // 1-4 into 5-8 in order to encode multiple staves within the same part, to
  // json_score voice assignments, which use staff number to encode multiple
  // staves within the same part separately, and a voice number always in the
  // range 1-4.
  
  if (voice_no_from_xml != undefined){
    // There is a maximum of four voices per staff. In MusicXML 2.0, voices 5-8
    // are used to encode a second staff in the same part. In a json_score
    // these will have separate staff numbers, and this is handled here. The
    // convention of using voices 5-8 to encode a second staff in the same part
    // is not adhered to by hum2xml.
    var staff_idx = Math.floor((voice_no_from_xml - 1)/4);
    var staffNo = staff_nos_for_this_id[staff_idx];
    var voiceNo = voice_no_from_xml%4 - 1;
  }
  else{
    var staffNo = part_idx;
    var voiceNo = 0;
  }
  return [staffNo, voiceNo];
}
exports.staff_voice_xml2staff_voice_json = staff_voice_xml2staff_voice_json;

// Example:
//var voice_no_from_xml = 6;
//var staff_nos_for_this_id = [9, 10];
//var part_idx = 8;
//var ans = staff_voice_xml2staff_voice_json(
//            voice_no_from_xml, staff_nos_for_this_id, part_idx);
//console.log(ans); // Should give [10, 1];


function remove_duplicate_clef_changes(clef_changes){
  // Tom Collins 23/2/2015.
  // This function inspects pairs of clef changes. If there is a clef change
  // in bar n, and a clef change to the same clef in bar n + 1, the clef
  // change in bar n is removed because it is probably a cautionary.
  
  var arr_out = [];
  for (clefi = 0; clefi < clef_changes.length - 1; clefi++){
    if (clef_changes[clefi + 1].barNo != clef_changes[clefi].barNo + 1 ||
        clef_changes[clefi + 1].clef != clef_changes[clefi].clef ||
        clef_changes[clefi + 1].staffNo != clef_changes[clefi].staffNo){
      arr_out.push(clef_changes[clefi]);
    }
  }
  if (clef_changes.length > 0){
    arr_out.push(clef_changes[clef_changes.length - 1]);
  }
  return arr_out; 
}
exports.remove_duplicate_clef_changes = remove_duplicate_clef_changes;

// Example:
//var clef_changes = [{ "barNo": 1, "clef": "treble clef", "staffNo": 0 },
//                    { "barNo": 5, "clef": "alto clef", "staffNo": 0 },
//                    { "barNo": 6, "clef": "alto clef", "staffNo": 0 },
//                    { "barNo": 1, "clef": "bass clef", "staffNo": 1 },
//                    { "barNo": 16, "clef": "bass clef", "staffNo": 1 }];
//var ans = remove_duplicate_clef_changes(clef_changes); // Should give:
//[{ "barNo": 1, "clef": "treble clef", "staffNo": 0 },
// { "barNo": 6, "clef": "alto clef", "staffNo": 0 },
// { "barNo": 1, "clef": "bass clef", "staffNo": 1 },
// { "barNo": 16, "clef": "bass clef", "staffNo": 1 }].


function convert_1st_bar2anacrusis_val(bar_1, divisions){
  // Tom Collins 25/2/2015.
  
  // Get top and bottom number from time signature, to work out how long a full
  // first bar should last.
  if (bar_1.attributes){
    var attributes = bar_1.attributes;
    for (var j = 0; j < attributes.length; j++){
      if (attributes[j].time){
        // Assuming there is only one time per attribute...
        var time_sig_1 = {};
        time_sig_1.topNo = parseInt(attributes[j].time[0].beats[0]);
        time_sig_1.bottomNo = parseInt(attributes[j].time[0]['beat-type'][0]);
        }
    }
  }
  if (time_sig_1 == undefined) {
    console.log('It was not possible to find a time signature in the first ' +
                'bar of the top staff.');
    console.log('Returning default values for the anacrusis and crotchets '+
                'bar, which may be wrong.');
    return [0, 4];
  }
  
  var anacrusis = 0;
  var crotchets_per_bar = 4*time_sig_1.topNo/time_sig_1.bottomNo;
  var dur_in_1st_bar_should_be = divisions*crotchets_per_bar;
  // console.log('dur_in_1st_bar_should_be:');
  // console.log(dur_in_1st_bar_should_be);
  var ontime = 0;
  
  // Get backup value.
  if (bar_1.backup){
    var backups = bar_1.backup;
    }
  else{
    backups = [];
  }
  
  // Increment over the notes.
  if (bar_1.note){
    var notes = bar_1.note;
    for (note_index = 0; note_index < notes.length; note_index++){
      if (notes[note_index].grace == undefined){
        // This is the integer duration expressed in MusicXML.
        var duration = parseInt(notes[note_index].duration[0]);
        var offtime = ontime + duration;
        // Correct rounding errors in the offtime values.
        // If the note is a second, third, etc. note of a chord, then do
        // not increment the ontime variable.
        if (note_index < notes.length - 1 && notes[note_index + 1].chord){
        }
        else { // Do increment the ontime value.
          ontime = offtime;
          console.log('running ontime:');
          console.log(ontime);
        }
      }
    }
  }
  var compar = ontime/(backups.length + 1);
  // console.log('compar:');
  // console.log(compar);
  if (compar != dur_in_1st_bar_should_be){
    anacrusis = -compar/divisions;
  }
  return [anacrusis, crotchets_per_bar];
}
exports.convert_1st_bar2anacrusis_val = convert_1st_bar2anacrusis_val;

// Example:
//var bar_1 = { '$': { number: '0', implicit: 'yes', width: '195.58' },
//              print: [ { 'system-layout': [Object] } ],
//              attributes: [ { divisions: [6], key: [],
//                              time: [ { beats: [4], 'beat-type': [4] } ],
//                              clef: ['blah'] } ],
//              note: [ { rest: [], duration: [3], voice: [1], type: [] },
//                      { '$': [], pitch: [], duration: [1], voice: [2], type: [],
//                        'time-modification': [], stem: [], beam: [], notations: [] },
//                      { '$': [], pitch: [], duration: [1], voice: [2], type: [],
//                        'time-modification': [], stem: [], beam: [], notations: [] },
//                      { rest: [], duration: [1], voice: [2], type: [],
//                        'time-modification': [], notations: [] } ],
//              backup: [ { duration: [3] } ] };
//var divisions = 6;
//var ans = convert_1st_bar2anacrusis_val(bar_1, divisions);
//console.log(ans); // Should give -0.5.


function resolve_expressions(expressions){
  // Tom Collins 28/2/2015
  // When crescendos and diminuendos are expressed as lines (hairpins, wedges),
  // they have a stopping point as well as a starting point. This function
  // locates wedges stops corresponding to wedge starts, and unites the two
  // pieces of information in one array object.
  
  // Remove all stop wedges from the expressions array.
  var wedge_stops = [];
  var i = expressions.length - 1;
  while (i >= 0){
    if (expressions[i].type.wedge && expressions[i].type.wedge == "stop"){
      wedge_stops.push(expressions[i]);
      expressions.splice(i, 1);
    }
    i--;
  }
  // Loop over the expressions array and associate each wedge with a member of
  // wedge_stops.
  for (j = 0; j < expressions.length; j++){
    if (expressions[j].type.wedge){
      // Find the target index in wedge_stops.
      target_idx = -1;
      var k = 0;
      while (k < wedge_stops.length){
        if (wedge_stops[k].staffNo == expressions[j].staffNo &&
            wedge_stops[k].placement == expressions[j].placement &&
            wedge_stops[k].ontime >= expressions[j].ontime){
          // We found it!
          target_idx = k;
          k = wedge_stops.length - 1;
        }
        k++;
      }
      if (target_idx >= 0){
        // Add some properties to expressions[j].
        expressions[j].barOff = wedge_stops[target_idx].barOn;
        expressions[j].beatOff = wedge_stops[target_idx].beatOn;
        expressions[j].offtime = wedge_stops[target_idx].ontime;
      }
      else{
        console.log('Could not find a stop for wedge:');
        console.log(expressions[j]);
      }
    }
  }
  return expressions;
}
exports.resolve_expressions = resolve_expressions;

//var expressions = [{ "ID": "0", "barOn": 1, "beatOn": 1, "ontime": 0,
//                     "type": { "wedge": "crescendo" },
//                     "placement": "below", "staffNo": 0 },
//                   { "ID": "1", "barOn": 1, "beatOn": 1, "ontime": 0,
//                     "type": { "wedge": "diminuendo" },
//                     "placement": "above", "staffNo": 0 },
//                   { "ID": "2", "barOn": 1, "beatOn": 1, "ontime": 0,
//                     "type": { "dynamics": "f" },
//                     "placement": "below", "staffNo": 0 },
//                   { "ID": "3", "barOn": 1, "beatOn": 1, "ontime": 0,
//                     "type": { "wedge": "stop" },
//                     "placement": "below", "staffNo": 0 },
//                   { "ID": "4", "barOn": 1, "beatOn": 1, "ontime": 0,
//                     "type": { "wedge": "stop" },
//                     "placement": "above", "staffNo": 0 },
//                   { "ID": "5", "barOn": 2, "beatOn": 1, "ontime": 3,
//                     "type": { "dynamics": "fff" },
//                     "placement": "below", "staffNo": 0 }];
//var ans = resolve_expressions(expressions);
//console.log(ans); // Should give:
//[{ "ID": "0", "barOn": 1, "beatOn": 1, "ontime": 0,
//   "type": { "wedge": "crescendo" },
//   "placement": "below", "staffNo": 0,
//   "barOff": 1, "beatOff": 1, "offtime": 0 },
// { "ID": "1", "barOn": 1, "beatOn": 1, "ontime": 0,
//   "type": { "wedge": "diminuendo" },
//   "placement": "above", "staffNo": 0,
//    "barOff": 1, "beatOff": 1, "offtime": 0 },
// { "ID": "2", "barOn": 1, "beatOn": 1, "ontime": 0,
//   "type": { "dynamics": "f" },
//   "placement": "below", "staffNo": 0 },
// { "ID": "5", "barOn": 2, "beatOn": 1, "ontime": 3,
//   "type": { "dynamics": "fff" },
//   "placement": "below", "staffNo": 0 }];

function default_page_and_system_breaks(staff_and_clef_names, final_bar_no){
   // Tom Collins 1/3/2015
   // If the page_breaks and system_breaks variables are empty, this function
   // will populate them with default values based on the number of staves and
   // bars.
   
   var page_breaks = [];
   var system_breaks = [];
   var nos_staves = staff_and_clef_names.length;
   switch (nos_staves){
      case 1:
         var sbreak = 4;
         var pbreak = 10*sbreak;
         break;
      case 2:
         var sbreak = 4;
         var pbreak = 5*sbreak;
         break;
      case 3:
         var sbreak = 4;
         var pbreak = 3*sbreak;
         break;
      case 4:
         var sbreak = 4;
         var pbreak = 2*sbreak;
         break;
      case 5:
         var sbreak = 4;
         var pbreak = 2*sbreak;
         break;
      case 6:
         var sbreak = 4;
         var pbreak = 2*sbreak;
         break;
      default:
         var sbreak = 4;
         var pbreak = sbreak;
         break;
   }
   var curr_bar = sbreak;
   while (curr_bar < final_bar_no){
      if (curr_bar%pbreak == 0){
         page_breaks.push(curr_bar + 1);
      }
      else{
         system_breaks.push(curr_bar + 1);
      }
      curr_bar = curr_bar + sbreak;
   }
   return [page_breaks, system_breaks];
}
exports.default_page_and_system_breaks = default_page_and_system_breaks;

// Example:
//var staff_and_clef_names = [ { "name": "soprn", "id": "P1",
//                               "clef": "treble clef", "clefSign": "G",
//                               "clefLine": 2, "staffNo": 0 },
//                             { "name": "alto", "id": "P2",
//                               "clef": "treble clef", "clefSign": "G",
//                               "clefLine": 2, "staffNo": 1 } ];
//var final_bar_no = 100;
//var ans = default_page_and_system_breaks(staff_and_clef_names, final_bar_no);
//console.log(ans); // Should give:
//[[21, 41, 61, 81],
// [5, 9, 13, 17, 25, 29, 33, 37, 45, 49, 53, 57, 65, 69, 73, 77, 85, 89, 93, 97]].


// I was going to write a function that identified the placement of clef
// changes within a measure, but gave up because I think the way the XML is
// converted to json makes this difficult to do. See for instance measure3
// below. There are two notes, then a backup, then two notes, then a clef
// change, but this isn't how the XML is converted to json: all the notes
// appear in one array, so the placement of .

//function ontime_of_clef_change(measure, ontime_begin, ontime_end, divisions){
//   
//   
//}
//var measure1 = { $: { number: '15', width: '192.28' },
//                 note: [ { rest: [], duration: [], voice: [] } ],
//                 attributes: [ { clef: [Object] } ] };
//var measure2 = { $: { number: '15', width: '192.28' },
//                 note: [ { rest: [], duration: [], voice: [] },
//                         { rest: [], duration: [], voice: [] } ],
//                 attributes: [ { clef: [Object] } ] };
//var measure3 = { $: { number: '15', width: '192.28' },
//                 note: [ { rest: [], duration: [12], voice: [] },
//                         { rest: [], duration: [12], voice: [] },
//                         { rest: [], duration: [12], voice: [] },
//                         { rest: [], duration: [12], voice: [] },
//                         { rest: [], duration: [6], voice: [] },
//                         { rest: [], duration: [18], voice: [] }],
//                 backup: [ { duration: 24}, { duration: 24} ],
//                 note: [ { rest: [], duration: [], voice: [] },
//                         { rest: [], duration: [], voice: [] } ],
//                 attributes: [ { clef: [Object] } ] };



function midi_note_morphetic_pair2pitch_and_octave(mnn, mpn){
   // Tom Collins 15/10/2014.
   // This function converts a pair consisting of a MIDI note number
   // and a morphetic pitch number into a string consisting of a note's
   // pitch and octave.

   var octave = Math.floor((mpn - 32)/7);
   var midi_residue = mnn - 12*(octave + 1);
   var mpn_residue = mpn - (7*octave + 32);
   // console.log(midi_residue);
   // console.log(mpn_residue);
   var pitch_class_lookup_array = new Array;
   pitch_class_lookup_array = [[[12, 6], "B#"], [[0, 0], "C"], [[0, 1], "Dbb"],
                                                           [[13, 6], "B##"], [[1, 0], "C#"], [[1, 1], "Db"],
                                                           [[2, 0], "C##"], [[2, 1], "D"], [[2, 2], "Ebb" ],
                                                           [[3, 1], "D#"], [[3, 2], "Eb"], [[4, 1], "D##"],
                                                           [[4, 2], "E"], [[3, 3], "Fbb"], [[5, 2], "E#"],
                                                           [[5, 3], "F"], [[5, 4], "Gbb"], [[6, 2], "E##"],
                                                           [[6, 3], "F#"], [[6, 4], "Gb"], [[7, 3], "F##"],
                                                           [[7, 4], "G"], [[7, 5], "Abb"], [[8, 4], "G#"],
                                                           [[8, 5], "Ab"], [[9, 4], "G##"], [[9, 5], "A"],
                                                           [[9, 6], "Bbb"], [[-2, 0], "Cbb"],
                                                           [[10, 5], "A#"], [[10, 6], "Bb"],
                                                           [[11, 5], "A##"], [[11, 6], "B"],
                                                           [[-1, 0], "Cb"]];
   var pitch_class_idx = 1;
   var n = pitch_class_lookup_array.length;
   var i = 0;
   while (i < n){
       if (midi_residue == pitch_class_lookup_array[i][0][0] &&
               mpn_residue == pitch_class_lookup_array[i][0][1]){
           pitch_class_idx = i;
           i = n - 1;
       }
       i=i+1;
   }
   a = pitch_class_lookup_array[pitch_class_idx][1] + octave;
   // console.log("This is a test of midi_note_morphetic_pair_to_pitch_and_octave:");
   // console.log(a);
   return a;


};
exports.midi_note_morphetic_pair2pitch_and_octave =
   midi_note_morphetic_pair2pitch_and_octave;


exports.MNN2pitch_simple = function MNN2pitch_simple(MNN){
  // Tom Collins 6/1/2016.
  // In
  // metadata Integer mandatory
  // Out String
  // This function converts a MIDI note number into a pitch class and octave.
  // It does so in a completely naive manner (no consideration of global or
  // local key), but this is handy for things like Tone.js playback, which tend
  // to prefer "C" to "B#", "C#" to "Db" (I think), and "G" to "F##".
  
  var lookup = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  var octave = Math.floor(MNN/12 - 1);
  var MNN_mod_12 = MNN % 12;
  return lookup[MNN_mod_12] + octave.toString();
  
}
