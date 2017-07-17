// Tom Collins 2/10/2017.
// This script converts the directory of MusicXML files into JSON format.

// Requires.
var fs = require('fs'); // File system operations library.
var mu = require('maia-util');
var xml2json=require('./musicxml/xml2json').convert;
var user = 'orchi';
if (user == 'orchi'){
  //var inPath = __dirname + '/../../path/to/your/MusicXML/files/';
  var inPath = __dirname + '/../../MusicXML'
  var outPath = __dirname + '/../../MusicXML_2_JSON/';
}
else {
  var inPath = __dirname + '/../../path/to/your/MusicXML/files/';
  var outPath = __dirname + '/../../output/directory/which/must/exist/already/';
}

// I assume you have separate folders for Hendrix, Page, Clapton, etc.
var bnames = fs.readdirSync(inPath);
console.log('bnames:', bnames);
// Iterate over band names to get song names.
for (iband = 0; iband < bnames.length; iband++){
 if (bnames[iband] !== ".DS_Store"){
  songPath = inPath + '/' + bnames[iband];
  var snames = fs.readdirSync(songPath);
  // Iterate over song names to convert MusicXML files to JSON.
  for (isong = 0; isong < snames.length; isong++){
   var sname = snames[isong];
   if (sname.slice(sname.length - 3) == "xml"){
    console.log('Processing song ' + snames[isong]);
    var xml = fs.readFileSync(songPath + '/' + snames[isong], 'utf8');
    console.log('xml.slice(0, 10):', xml.slice(0, 10));
    var composition_json = xml2json(xml, 'composerName', 'compositionTitle', function(json){
     if(json){ // if that was a success, then
      console.log('there is JSON...');
      // Orchi, this is the function, comp_obj2note_point_set, that needs
      // altering to include string/fret information from the MusicXML file.
      var d = mu.comp_obj2note_point_set(json);
      ///get key signature
      var key_scr = mu.comp_obj2key(json);
      //if no key signature is specified in xml file, calculate it using this algorithm
      if(!key_scr)
      {
        key_scr = mu.fifth_steps_mode(d, mu.krumhansl_and_kessler_key_profiles, 1, 3);
      }
      
      console.log('key signature :', key_scr);
      
      //get tonic pitch as midi note number
      var tonic_pitch = mu.tonic_pitch_closest(d, key_scr);
      console.log('Tonic Pitch MNN and MPN', tonic_pitch);
      var scale_degree = [];
      var sc = 0;
      
      for(var i = 0; i < d.length; i++){
        sc = (d[i][1] - tonic_pitch[0]);
        //all scale degrees condensed to within an octave
        sc = Math.sign(sc) * (Math.abs(sc)%12);
        //no negative scale degrees
        if(sc < 0){
          sc += 12;
        }
        scale_degree.push(sc);
      }

      //find the nearest C(major)/ A(minor) pitch closest to our tonic
      var mode = key_scr.split(" ")[1];
      var nearest_scale = 0;
      if(mode == "major"){
        nearest_scale = Math.floor(tonic_pitch[0] / 12) * 12;
      }
      else if(mode == "minor"){
        nearest_scale = (Math.floor(tonic_pitch[0] / 12) * 12) - 3;
      }

      //transpose frets to nearest Am/C scale
      var transpose = 0;
      var flag = true;
      var count = 0;
      var fret_transposed = [];
      while(flag == true){
      var fret = [];
      nearest_scale = nearest_scale + (count*12);
      for(var i = 0; i < d.length; i++){
        //transpose = d[i][5] - (d[i][1] - (nearest_scale + diff[i]));
        transpose = d[i][5] - (tonic_pitch[0] - nearest_scale);
        //this ensures that the lowest possible fret is 0 
        if(transpose < 0){
          flag = true;
          count++;
          break;
        }
        else{
          flag = false;
        }
        fret.push(transpose);
      }
      if(!flag)
        fret_transposed = Array.from(fret);
    }
    //console.log('Transposed frets ', fret_transposed);

    //add scale degrees and transposed frets to d
    for(var i = 0 ; i < d.length; i++){
      d[i].push(scale_degree[i]);
      //the modulus operation ensures that all frets are within [0,23]
      d[i].push(fret_transposed[i]%24);
    }

    //console.log('d.slice(0, 10)', d.slice(0, 10));

    //push only beat measure, string and transposed fret data to new array
    var time_sig = mu.comp_obj2time(json);
    console.log('Time signature', time_sig);
    var d_short = [];
    for(var i = 0; i < d.length; i++){
      d_short[i] = [];
      d_short[i].push(d[i][0] % time_sig);
      d_short[i].push(d[i][4]);
      d_short[i].push(d[i][7]);
      d_short[i].push(d[i][1]);
      d_short[i].push(d[i][6])
      d_short[i].push(d[i][3])
    }

      // Export the point sets to text files.
      fs.writeFileSync(outPath + '/' + bnames[iband] + '/' + snames[isong].slice(0, snames[isong].length - 3) + "json",
                       JSON.stringify(d, null, 2));
       // Export the point sets to text files.
      fs.writeFileSync(outPath + '/' + bnames[iband] + '/' + bnames[iband] +'_short/short_' + snames[isong].slice(0, snames[isong].length - 3) + "json",
                       JSON.stringify(d_short, null, 2));
     }
    });
   }
  }
 }
}

