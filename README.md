<h1>Guitarist classification from symbolic guitar tabs</h1>

<p>
This repository contains a dataset of 80 rock guitar solos by Hendrix, Knopfler, Clapton and Gilmour downloaded from UltimateGuitar, cleaned and converted to MusicXML. MusicXML is parsed using a JS library - tuples containing note duration, transposed fret and string information are ultimately stored in JSON format. Markov chains are trained on this data in a leave-one-out fashion and a maximum likelihood approach is used to identify the guitarist of each song. Other interesting visualizations are done in <b><i>R</b></i>, such as pitch class and note duration histograms and Markov Chains as weighted graphs.
</p>
<p>Due to the lack of a reliable dataset of guitar tabs, I encourage people to do projects with this dataset, and if possible contribute more tabs by more artists! If used in a project, please cite the following paper :

<a href = "https://ccrma.stanford.edu/~orchi/Documents/smc-2018.pdf"> - <i>Analyzing and Classifying Guitarists from Rock Guitar Solo Tablature</i> </a> - O. Das, B. Kaneshiro and T. Collins; Proceedings of 18th International Conference on Sound and Music Computing (SMC 2018), Limassol, Cyprus; July 2018.</a>

</p>


