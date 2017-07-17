library(rjson)
library(entropy)
library(RColorBrewer)
library(ggplot2)
library(reshape2)

inDir = '/home/orchisama/Documents/Stanford classes/Music 364/final project ideas/MusicXML_2_JSON';
setwd(inDir)
#these are list of lists that contain a list of scale degrees for each artist
rm(list = ls())
scale_degrees <- list()
beat_freq <- list()
strfret <- list()
strfret_mat <- list()
art = 1
#contains scale degree histogram for each artist
hist_scale <- list()
#contains beat histogram for each artist
hist_beat <- list()
ks_test <- list()
chi_test <- list()
#all states in a particular song
song_states <- list()
#all states belonging to a particular artist
art_states <- list()
#self similarity matrix among all songs
sim_mat <- matrix()


###################################################################################

#function to form a matrix with strings as rows and frets as columns
get.strfret.matrix <- function(strfret){
  strfret_mat = matrix(data = numeric(24*6), nrow = 6, ncol = 24, byrow = TRUE)
    for (i in 1:length(strfret)){
      pos = unlist(strfret[i])
      strfret_mat[7-pos[1],pos[2]+1] = strfret_mat[7-pos[1],pos[2]+1] + 1
    }
  #normalize so that maximum value is 1
  strfret_mat = strfret_mat/max(strfret_mat)
  return(strfret_mat)
}

#function to convert string and fret to MNN
stringfret2midi <- function(string, fret){
  open_string_midi = c(64, 59, 55, 50, 45, 40)
  return (open_string_midi[string] + fret);
}

##################################################################################

set.seed(11)
filenum = 1

#loop through artists
for (artist in list.dirs(full.names = TRUE, recursive = FALSE)){
  
  scale_degrees[[art]] <- list()
  beat_freq[[art]] <- list()
  strfret[[art]] <- list()
  ks_test[[art]] <- list()
  chi_test[[art]] <- list()
  offset = 0
  art_states[[art]] <- list()
  
  #loop through songs
  filelist <- list.files(path = paste(artist, "/", substr(artist,3,nchar(artist)), "_short/", sep = ""), pattern = ".*.json")
  fp <- lapply(filelist, function(x)file.path(paste(artist, "/", substr(artist,3,nchar(artist)), "_short", sep = ""),x))
  #extract JSON data for each song
  for (filePath in fp){
    song_states[[filenum]] <- list()
    json_data <- fromJSON(file = filePath)
    for (i in 1:length(json_data)){
      scale_degrees[[art]] = append(scale_degrees[[art]], json_data[[i]][5])
      beat_freq[[art]] = append(beat_freq[[art]], round(json_data[[i]][6]*1000)/1000)
      strfret[[art]][offset+i] = list(c(json_data[[i]][2], json_data[[i]][[3]]))
      song_states[[filenum]] = append(song_states[[filenum]], list(c(round(json_data[[i]][1]*100)/100, json_data[[i]][2], json_data[[i]][[3]])))
      #art_states[[art]][offset+i] = list(c(round(json_data[[i]][1]*1000)/1000, json_data[[i]][2], json_data[[i]][[3]]))
      art_states[[art]][offset+i] = list(c(round(json_data[[i]][1]*1000)/1000, stringfret2midi(json_data[[i]][2], json_data[[i]][[3]])))
    }
    filenum = filenum+1
    offset = offset+length(json_data)+1
  }
  
  ###########################################################################
  
  #plot fretboard heatmap for particular artist
  
  # strfret_mat[[art]] <- get.strfret.matrix(strfret[[art]])
  # 
  # #ggplot needs data in a data frame format
  # tt<-as.data.frame(strfret_mat[[art]])
  # colnames(tt) <- as.character(c(0:23))
  # tt$Strings <- c("E2","A2","D3","G3","B3","E4")
  # #order the Strings column so that ggplot does not order
  # #it alphabetically while plotting
  # tt$Strings <- factor(tt$Strings, levels = tt$Strings)
  # #puts dataframe in a nice form
  # tt_melt <- melt(tt)
  # colnames(tt_melt) <- c("Strings","Frets","value")
  # 
  # p <- ggplot(data=tt_melt,
  #       aes(x=Frets, y=Strings, fill=value)) + geom_tile() + geom_text(aes(label = value), colour = 'white') + 
  #       theme_bw()
  # 
  # #change axis ticks
  # p <- p + theme(axis.text.x = element_text(size=12, angle=45),
  #           axis.text.y = element_text(size=14)) + 
  #   scale_x_discrete(name = "") + scale_y_discrete(name = "")
  # print(p)
  # ggsave(paste("../identifying-rock-guitarists/latex/figs/", substr(artist,3,nchar(artist)), "_fretboard.png"), p)
  # 
  # ##############################################################

  #plot histogram of scale degrees for artist
  #convert list to a vector
  sc = unlist(cbind(scale_degrees[[art]]))
  hist_scale[[art]] <- hist(sc, main = paste("Scale degree histogram for", substr(artist,3,nchar(artist))),
                      xlab = "Scale degrees", ylab = "Frequency", right = F, breaks = seq(-1,12), plot = TRUE, xaxt = "n")
  #this makes sure labels are plotted in the middle of bars
  axis(side=1,at=hist_scale[[art]]$mids,labels=c("","C","C#","D","Eb","E","F","F#","G","G#", "A","Bb","B"))

  #for scaled degrees perform chi squared test to see if they fit a uniform distribution
  chi_test[[art]] <- chisq.test(table(sc))
  print(chi_test[[art]]$expected)

  #########################################################################

  #plot histogram of beats used
  bt = unlist(cbind(beat_freq[[art]]))
  nbeats = sort(unique(bt))
  bt_freq = as.data.frame(table(bt))$Freq
  barplot(bt_freq, names.arg = nbeats, main = paste("Beat distribution for", substr(artist,3,nchar(artist))),cex.names = 0.7,las=2)
  hist_beat[[art]] <- as.data.frame(table(bt))
  hist_beat[[art]]$beatName <- nbeats
  
  art = art+1
}


###########################################################################

#self similarity matrix among all songs
# numsongs = length(song_states)
# sim_mat = matrix(data = numeric(numsongs*numsongs), nrow = numsongs, ncol = numsongs, byrow = TRUE)
# for(i in 1:numsongs){
#   for(j in 1:numsongs){
#     #calculate Jaccard index
#     num_intersect = length(intersect(song_states[[i]],song_states[[j]]))
#     num_union = length(union(si,sj))
#     sim_mat[i,j] = num_intersect/num_union
#   }
# }
# 
# #plot similarity matrix with ggplot
# tt<-as.data.frame(sim_mat)
# colnames(tt) <- as.character(c(1:numsongs))
# tt$Songs <- as.character(c(1:numsongs))
# tt$Songs <- factor(tt$Songs, levels = tt$Songs)
# tt_melt <- melt(tt)
# colnames(tt_melt) <- c("songs_row","songs_col","value")
# tt_melt$value = round(tt_melt$value*1000)/1000
# 
# p <- ggplot(data=tt_melt,
#       aes(x=songs_row, y=songs_col, fill=value)) + geom_tile() 
# 
# #change axis ticks
# p <- p + theme(axis.text.x = element_text(size=10), axis.text.y = element_text(size=10)) +
#   scale_x_discrete(name = "", breaks=c("10","30","50","70"),
#                   labels=c("Clapton","Gilmour","Hendrix","Knopfler")) +
#   scale_y_discrete(name = "", breaks=c("10","30","50","70"),
#                   labels=c("Clapton","Gilmour","Hendrix","Knopfler"))
# print(p)


#self-similarity matrix between all artists
numart = 4
sim_mat = matrix(data = numeric(numart*numart), nrow = numart, ncol = numart, byrow = TRUE)
for(i in 1:numart){
  for(j in 1:numart){
    #calculate Jaccard index
    num_intersect = length(intersect(art_states[[i]],art_states[[j]]))
    num_union = length(union(art_states[[i]], art_states[[j]]))
    sim_mat[i,j] = num_intersect/num_union
  }
}

#plot similarity matrix with ggplot
tt<-as.data.frame(sim_mat)
colnames(tt) <- c("Clapton","Gilmour","Hendrix", "Knopfler")
tt$Artists <- c("Clapton","Gilmour","Hendrix", "Knopfler")
tt_melt <- melt(tt)
colnames(tt_melt) <- c("art_row","art_col","value")
tt_melt$value = round(tt_melt$value*1000)/1000

p <- ggplot(data=tt_melt, aes(x=art_row, y=art_col)) + scale_fill_gradientn(colours = c("skyblue2","blueviolet","blue","steelblue","slateblue4"), 
                                                                            breaks=c(0.25,0.3,0.32,0.34,0.5)) +
    geom_tile(aes(fill=value)) + geom_text(aes(label = value), colour = 'black', size = 5) + theme_bw() 

#change axis ticks
p <- p + theme(legend.position = "none", axis.text.x = element_text(size=12), axis.text.y = element_text(size=12)) +
  scale_x_discrete(name = "") + scale_y_discrete(name = "")
print(p)


#################################################################################

# #plot histogram of beat of measure
# beat_of_measure <- list()
# hist_beat_measure <- list()
# art = 1
# 
# for (artist in list.dirs(full.names = TRUE, recursive = FALSE)){
#   beat_of_measure[[art]] <- list()
#   #loop through songs
#   filelist <- list.files(path = paste(artist, "/", substr(artist,3,nchar(artist)), "_short/", sep = ""), pattern = ".*.json")
#   fp <- lapply(filelist, function(x)file.path(paste(artist, "/", substr(artist,3,nchar(artist)), "_short", sep = ""),x))
# 
#   #extract JSON data for each song
#   for (filePath in fp){
#     json_data <- fromJSON(file = filePath)
#     for (i in 1:length(json_data)){
#       beat_of_measure[[art]] = append(beat_of_measure[[art]], json_data[[i]][1])
#     }
#   }
# 
#   #plot histogram for beat of measure
#   bt = unlist(cbind(beat_of_measure[[art]]))
#   bt_freq = as.data.frame(table(bt))$Freq
#   hist_beat_measure[[art]] <- barplot(bt_freq, main = paste("Beat of measure distribution for", substr(artist,3,nchar(artist))), 
#                               names.arg =  as.data.frame(table(bt))$bt)
#  art = art+1
#}


#############################################################################################

#calculate kullback liebler distances to see how closely histograms are related
# common_beats = intersect(hist_beat[[1]]$bt, hist_beat[[2]]$bt)
# pos1 = match(common_beats, hist_beat[[1]]$bt)
# pos2 = match(common_beats, hist_beat[[2]]$bt)
# print(KL.plugin(hist_beat[[1]]$Freq[pos1], hist_beat[[2]]$Freq[pos2]))
# print(KL.plugin(tail(hist_scale[[1]]$counts,11), tail(hist_scale[[2]]$counts,11)))

###################################################################

#plot stacked bar plot of scale degrees for each artist

#change the margins to accommodate legend on right
par(mar = c(5,4,4,6) + 0.1)
rainbowcols <- brewer.pal(12, "Set3")

scale_counts <- list()
for (i in 1:(art-1)){
  #normalizing the values in bar plot is important to ensure all artists are represented equally
  toAppend = tail(hist_scale[[i]]$counts,-1)/max(hist_scale[[i]]$counts)
  #this makes sure all rows sum to 1
  toAppend = toAppend/sum(toAppend)
  scale_counts = append(scale_counts, toAppend)
}
scale_table <- matrix(scale_counts, ncol = 4, byrow = FALSE)
colnames(scale_table) <- c("Clapton","Gilmour","Hendrix","Knopfler")
rownames(scale_table) <- c("1","b2","2","b3","3","4","b5","5","b6","6","b7","7")
#colnames(scale_table) <- c("C","C#","D","Eb","E","F","F#","G","G#","A","Bb","B")
barplot(as.matrix(scale_table), col = rainbowcols, main = "Pitch class distribution", cex.main = 1.2, 
        ylab = "Normalized Frequency")
legend("right", inset = c(-0.15,0), fill = rainbowcols, legend = rownames(scale_table))

###################################################################

#plot stacked bar plot of beat distribution for each artist

beat_counts <- list()
beat_types <- list()
beat_types <- c(0.125,0.167,0.25,0.333,0.5,1,1.5,2,3,4)
for (i in 1:(art-1)){
  beats_art <- list()
  for(bt in beat_types){
    beats_art = append(beats_art, hist_beat[[i]]$Freq[which(hist_beat[[i]]$beatName == bt)])
  }
  beats_art = unlist(beats_art)/max(unlist(beats_art))
  beats_art = beats_art/sum(beats_art)
  beat_counts = append(beat_counts,beats_art)
}
beat_table <- matrix(beat_counts, ncol = 4, byrow = FALSE)
colnames(beat_table) <- c("Clapton","Gilmour","Hendrix","Knopfler")
rownames(beat_table) <- as.character(beat_types)
barplot(as.matrix(beat_table), col = rainbowcols, main = "Note duration distribution", cex.main = 1.2,
        ylab = 'Normalized Frequency') 
legend("right", inset = -0.2, fill = rainbowcols, legend = rownames(beat_table))

############################################################################


