library(rjson)
library(markovchain)
library(caret)

inDir = '/home/orchisama/Documents/Stanford classes/Music 364/final project ideas/MusicXML_2_JSON';
setwd(inDir)
#these are list of lists that contain a list of scale degrees for each artist
rm(list = ls())
states <- list()
data_frame <- list()
unique_states <- list()
trans_mat <- list()
zero_order_prob <- list()
init_dist <- list()
markov <- list()
song_state <- list()
song_prob_list <-list()
artist_detected <- list()
prob_artist <- list()
guitarist = c("Clapton", "Gilmour", "Hendrix", "Knopfler")
art = 1


#####################################################################################

#Here I define all the functions I will use.

#function to get initial probability
get.initial.probability <- function(init_dist, init_song_state){
  count = 0
  for(state in init_dist){
    if(isTRUE(identical(state, init_song_state)))
      count = count + 1
  }
  return(count/length(init_dist))
}


#function to get transition matrix for first order markov model
get.transition.matrix <- function(all_states, unique_states){
  trans_mat = matrix(data = numeric(length(uns)**2), nrow = length(uns), ncol = length(uns), byrow = TRUE)
  for(us in unique_states){
    ind = which(all_states == us)
    norm = length(ind)
    for(i in ind){
        if(all_states[i+1] == all_states[i] || i == length(all_states))
          trans_mat[us,us] = trans_mat[us,us]+1
        else
          trans_mat[us,all_states[i+1]] = trans_mat[us, all_states[i+1]] + 1 
    }
    trans_mat[us,] = trans_mat[us,]/norm
  }
  return(trans_mat)
}


#function to get probabilities for zero-order markov model
get.zero.order.probability <- function(all_states,unique_states){
  prob_list <- numeric(length(unique_states))
  for(us in unique_states){
    ind = which(all_states == us)
    prob_list[us] = length(ind)
  }
  prob_list = prob_list/length(all_states)
  return (prob_list)
}


#function to get position of a state in transition matrix or zero order probability list
get.position.in.transition.matrix <- function(ss, unique_states){
  for(i in 1:length(unique_states)){
    if(isTRUE(identical(unique_states[i],ss))){
      return (i)
    }
  }
  return (-1)
}

#function to encode each unique state as a unique number
encode.states <- function(states, unique_states){
  encode = integer(length(states))
  for(i in 1:length(unique_states)){
    for(j in 1:length(states)){
      if(isTRUE(identical(unique_states[i],states[j])))
        encode[j] = i
    }
  }
  return (encode)
}

#function to convert string and fret to MNN
stringfret2midi <- function(string, fret){
  open_string_midi = c(64, 59, 55, 50, 45, 40)
  return (open_string_midi[string] + fret);
}


##################################################################################

# #this is only for visualization and calculating properties of transition matrices
for (artist in list.dirs(full.names = TRUE, recursive = FALSE)){

  #initialising
  states[[art]] <- list()
  unique_states[[art]] <- list()
  offset = 0

  #loop through songs
  filelist <- list.files(path = paste(artist, "/", substr(artist,3,nchar(artist)), "_short/", sep = ""), pattern = ".*.json")
  fp <- lapply(filelist, function(x)file.path(paste(artist, "/", substr(artist,3,nchar(artist)), "_short", sep = ""),x))

  #extract JSON data for each song

  for (filePath in fp){
    json_data <- fromJSON(file = filePath)
    for (i in 1:length(json_data)){
      states[[art]][i+offset] <-  list(c(round(json_data[[i]][1]*100)/100, json_data[[i]][2], json_data[[i]][3]))
      #states[[art]][i+offset] <- list(c(round(json_data[[i]][1]*100)/100, stringfret2midi(json_data[[i]][2], json_data[[i]][3])))
    }
     offset = offset + length(json_data) + 1
  }

  #encode each unique state by a unique number
  encode = match(states[[art]], unique(states[[art]]))
  #uns is the state matrix
  uns = unique(encode)
  #these are the states of our markov model
  unique_states[[art]] = uns
  #find state transition matrix
  trans_mat[[art]] <- get.transition.matrix(encode, uns)

  print(paste('Number of unique states (vertices) for', substr(artist,3,nchar(artist)), ':',
         nrow(trans_mat[[art]])))
  print(paste('Sparsity of transition matrix for', substr(artist,3,nchar(artist)), ':', sum(rowSums(trans_mat[[art]] == 0))/(nrow(trans_mat[[art]])^2)*100))
  print(paste('Number of edges in graph (non-zero values in transition matrix) for', substr(artist,3,nchar(artist)), ':', (nrow(trans_mat[[art]])^2) - sum(rowSums(trans_mat[[art]] == 0))))
  print(paste('Density of graph for', substr(artist,3,nchar(artist)), ':',  2*(nrow(trans_mat[[art]])^2 - sum(rowSums(trans_mat[[art]] == 0)))/
   ((nrow(trans_mat[[art]])) * (nrow(trans_mat[[art]])-1))))

  #create a markov chain object for visualization
  markov[[art]] <- new("markovchain", transitionMatrix = trans_mat[[art]],
                       states = as.character(unique_states[[art]]), name = paste("Markov chain for", substr(artist,3,nchar(artist))))

  png(paste("../identifying-rock-guitarists/markov_",substr(artist,3,nchar(artist)),'.png'),width = 1000, height= 900)
  par(cex.main = 3)
  plot(markov[[art]], vertex.size = 6, edge.arrow.size = 0.4, vertex.label.cex = 0.5, edge.label.cex = 0.5,
       main = substr(artist,3,nchar(artist)))
  dev.off()
  art = art+1
}


######################################################################################

#do LOOCV with markov chain analysis

for(lartist in list.dirs(full.names = TRUE, recursive = FALSE)){

    songlist <- list.files(path = paste(lartist, "/", substr(lartist,3,nchar(lartist)), "_short/", sep = ""), pattern = ".*.json")
    sl <- lapply(songlist, function(x)file.path(paste(lartist, "/", substr(lartist,3,nchar(lartist)), "_short", sep = ""),x))

    for(testPath in sl){

    print(paste('Analyzing song:', testPath))

    test_data <- fromJSON(file = testPath)
    prob_artist <- list()
    song_state <- list()

    #save the current song's state
    #quite a few options for state space, uncomment each and check for results
    for(i in 1:length(test_data)){
      #state space with beat of measure, string, transposed fret
      song_state[i] <- list(c(round(test_data[[i]][1]*1000)/1000, test_data[[i]][2], test_data[[i]][3]))
      #state space with beat of measure, transposed MNN
      #song_state[i] <- list(c(round(test_data[[i]][1]*1000)/1000, stringfret2midi(test_data[[i]][2], test_data[[i]][3])))
    }

    art = 1
    for (artist in list.dirs(full.names = TRUE, recursive = FALSE)){

      #these need to be reinitialised for each song
      states[[art]] <- list()
      unique_states[[art]] <- list()
      trans_mat[[art]] <- matrix()
      zero_order_prob[[art]] <- list()
      song_prob_list[[art]] <- list()
      init_dist[[art]] <- list()
      offset = 0

      #get list of all songs of that particular artist
      filelist <- list.files(path = paste(artist, "/", substr(artist,3,nchar(artist)), "_short/", sep = ""), pattern = ".*.json")
      fp <- lapply(filelist, function(x)file.path(paste(artist, "/", substr(artist,3,nchar(artist)), "_short", sep = ""),x))

      #train transition matrix on all songs except the current song
      trainFiles = fp[fp != testPath]
      for(trainPath in trainFiles){
        train_data <- fromJSON(file = trainPath)

        #quite a few options for state space, uncomment each and check for results
        for(i in 1:length(train_data)){
          states[[art]][i+offset] <- list(c(round(train_data[[i]][1]*1000)/1000, train_data[[i]][2], train_data[[i]][3]))
          #states[[art]][i+offset] <- list(c(round(train_data[[i]][1]*1000)/1000, stringfret2midi(train_data[[i]][2], train_data[[i]][3])))
        }
        offset = offset+length(train_data)+1

        #update initial distribution for each artist
        init_dist[[art]] <- append(init_dist[[art]], list(c(round(train_data[[1]][1]*100)/100, train_data[[1]][2], train_data[[1]][3])))
      }

      #these are the states of our markov model
      unique_states[[art]] = unique(states[[art]])
      #encode each unique state by a unique number
      encode = match(states[[art]], unique_states[[art]])
      #uns is the state matrix
      uns = unique(encode)
      #find state transition matrix for all songs except the song being analysed for first order markov model
      trans_mat[[art]] <- get.transition.matrix(encode, uns)
      #find probability list for zero-order markov model
      #zero_order_prob[[art]] <- get.zero.order.probability(encode, uns)


    #loop through states of test song and see how many of them match with
    #states in the transition list. This will give us a list of probabilities
    #for observing the path of states in the test song
    pos_ss = integer(length(song_state))
    for(n in 1:length(song_state)){
      pos_ss[n] = get.position.in.transition.matrix(list(song_state[[n]]), unique_states[[art]])
    }

    #get initial probability from initial distribution of artist
    init_prob = get.initial.probability(init_dist[[art]], list(song_state[[1]]))
    if(init_prob == 0) init_prob = 1/20000
    song_prob_list[[art]] = init_prob

    #first order markov model
    for(n in 1:(length(song_state)-1)){
      #if state is not found in transition matrix or has zero probability of occurrence,
      #give it some arbitrarily small value
      if(pos_ss[n] == -1 || pos_ss[n+1] == -1 || trans_mat[[art]][pos_ss[n],pos_ss[n+1]] == 0)
        song_prob_list[[art]] = append(song_prob_list[[art]], 1/20000)
      else
        song_prob_list[[art]] = append(song_prob_list[[art]],trans_mat[[art]][pos_ss[n], pos_ss[n+1]])
    }

    #zero order markov model
    # for(n in 1:length(song_state)){
    #   if(pos_ss[n] == -1 || zero_order_prob[[art]][pos_ss[n]] == 0)
    #     song_prob_list[[art]] = append(song_prob_list[[art]],1/20000)
    #   else
    #     song_prob_list[[art]] = append(song_prob_list[[art]],zero_order_prob[[art]][pos_ss[n]])
    # }

    #calculating log likelihood for each artist
    prob_artist[[art]] = sum(log(unlist(song_prob_list[[art]])))
    #prob_artist[[art]] = mean(unlist(song_prob_list[[art]]))
    art = art+1
    }

    #find artist with maximum likelihood
    artist_detected = append(artist_detected, guitarist[which.max(prob_artist)])
    }
}

true_artist <- c(rep("Clapton",each = 20), rep("Gilmour", each = 20), rep("Hendrix", each = 20),
                 rep("Knopfler", each = 20))
#look at confusion matrix
confMat <- confusionMatrix(unlist(artist_detected), true_artist)
print(confMat)






