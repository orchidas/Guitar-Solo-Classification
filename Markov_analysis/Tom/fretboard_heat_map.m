% Copyright Tom Collins 4/11/2017.

% This script imports a bunch of arrays from json files. They are
% distributions of string/fret numbers for guitar solos. It converts them
% to matrices for training neural networks, as well as visualizes them.

% This is the maximum fret observed when the data were created.
max_fret = 24; % One greater than JS output because Matlab is one-indexed.
plot_tf = 1;

% Paths.
inPath = fullfile('~', 'Dropbox', 'collDataInit', 'private', 'projects',...
  'guitarSoloClassifier', '20170411');
%inPath = fullfile('~','Documents','Stanford classes','Music 364','final project ideas', 'MusicXML_2_JSON');
initial_bnames = dir(inPath);
bnames = cell(size(initial_bnames, 1), 1);
jband = 1;
for iband = 1:size(initial_bnames, 1)
  if ~strcmp(initial_bnames(iband).name, '.') &&...
      ~strcmp(initial_bnames(iband).name, '..') &&...
      ~strcmp(initial_bnames(iband).name, '.DS_Store') &&...
      ~strcmp(initial_bnames(iband).name, 'fretboard_heat_map.ps')
    bnames{jband} = initial_bnames(iband).name;
    jband=jband+1;
  end
end
bnames = bnames(1:jband - 1);
clear S;
S.bname = bnames{1};
for iband = 2:jband - 1
  S(iband).bname = bnames{iband};
end

% Iterate over the band and song names and convert each distribution to a
% fretboard heat map.
plots_per_page = 6;
iplot = 1;
for iband = 1:size(bnames, 1)
  snames = dir(fullfile(inPath, bnames{iband}, ['*.txt']));
  clear s;
  s.sname = snames(1).name;
  for isong = 1:size(snames, 1)
    if isong > 1
      s(isong).sname = snames(isong).name;
    end
    fid = fopen(fullfile(inPath, bnames{iband}, snames(isong).name));
    TT = textscan(fid, '%s');
    fclose(fid);
    TT = TT{1};
    % Convert the javascript count array to a matrix count, c. The format
    % of the matrix count is [string no, fret no, count].
    c = zeros(size(TT, 1), 3);
    ic = 1;
    iT = 4;
    col = 1;
    into_count = 0;
    while iT < size(TT, 1)
      switch TT{iT}
        case '['
          col = 1;
        case '],'
          ic=ic+1;
        case ']'
          num_rows = ic - 1;
          ic = 0;
          into_count = 1;
        otherwise
          curr_num = str2num(TT{iT});
          if into_count
            col = 3;
            c(ic, col) = curr_num;
            ic=ic+1;
          else
            c(ic, col) = curr_num;
            col = 2;
          end
      end
      iT=iT+1;
    end
    c = c(1:num_rows, :);
    % Normalize so the weights sum to one.
    c(:, 4) = c(:, 3)/sum(c(:, 3));
    % Convert to heat map.
    hm = zeros(6, max_fret);
    for ic = 1:num_rows
      hm(c(ic, 1), c(ic, 2) + 1) = c(ic, 4);
    end
    % Store the count matrix and heat map.
    if isong == 1
      s.countmx = c;
      s.heatmap = hm;
    else
      s(isong).countmx = c;
      s(isong).heatmap = hm;
    end
    % Optionally plot the heat map.
    if plot_tf
      subplot(plots_per_page, 1, iplot)
      imagesc(hm);
      title(snames(isong).name, 'Interpreter', 'None')
      xticks([1 4 6 8 10 13 16 18 20 22 25 28 30 32 34 37]);
      xticklabels({'o' 3 5 7 9 12 15 17 19 21 24 27 29 31 33 36});
      yticks(1:6);
      yticklabels({'E4', 'B3', 'G3', 'D3', 'A2', 'E2'});
      % axis xy;
      if iplot == 6
        set(gcf, 'PaperUnits', 'inches');
        set(gcf, 'PaperSize', [6 9]);
        set(gcf, 'PaperPosition', [0 1 5 8]); % left, bottom, width, height.
        print('-dpsc', '-append',...
          fullfile(inPath, 'fretboard_heat_maps.ps'))
        iplot = 0;
      end
      iplot=iplot+1;
    end
  end
  S(iband).songs = s;
end

% Save S.
save(fullfile(inPath, 'S'), 'S');