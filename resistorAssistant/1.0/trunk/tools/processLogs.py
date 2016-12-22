# This version only works from 2016.10.27 since that is when the logging from index.js was update to work with this script.


import seaborn as sns
import os
import glob
import pandas
import numpy
import patoolib
import re
from dateutil import parser

# def clearExtractedFiles(dir="out\\extracted"):
# 	# clear files generated from logs
# 	print("clearExtractedFile.")


# def backupConcatLog():
# 	print("backupConcatLog")

def extractFiles(inDir="logs", outDir="out\\extracted"):
	if not os.path.exists(outDir):
		os.makedirs(outDir)
	outFiles = os.listdir(outDir)
	# get all the archive files.  files that end with .gz.
	archives = []
	for root,dirs,inFiles in os.walk(inDir):
		for inFile in inFiles:
			if inFile.endswith(".gz"):
				archives.append(os.path.join(root,inFile))
	for archive in archives:
		# create a unique file name for each log file.
		reOutFile = re.search('(\d{4}-\d{2}-\d{2}-)\[.*\](.*).gz$',archive)
		outFile = reOutFile.group(1) + reOutFile.group(2).replace("\\","-")
		# figure out the extracted file name so we can rename it to outfile.
		extractFile = re.search('(\d{6}).gz',archive).group(1)
		# if we have not already extracted this file.
		if outFile not in outFiles:
			outFiles.append(outFile)
			# patoolib extracts the file as the same name without the .gz extension.
			patoolib.extract_archive(archive,outdir=outDir)
			# rename the file to something unique.
			os.rename(os.path.join(outDir,extractFile),os.path.join(outDir,outFile))

# take the downloaded log files and put them into one text file.
# use the concatIndex.txt file to make sure we don't concatenate the same log file multiple times.
# there is no gaurentee that the log files will be concatenated in order.
def concatenate(inDir = "out\\extracted", outDir = "out", outFilename = "concatLog.txt", indexFilename = "concatIndex.txt"):
	if os.path.isfile(os.path.join(outDir,indexFilename)):
		with open(os.path.join(outDir,indexFilename), 'r') as indexFile:
			indexes = indexFile.read().splitlines()
	else:
		indexes = []
	inFileList = glob.glob(os.path.join(inDir,"*"))
	with open(os.path.join(outDir,outFilename), 'a') as outFile:
		for inFilename in inFileList:
			if inFilename not in indexes:
				with open(inFilename, 'r') as inFile:
					outFile.write(inFile.read())
				with open(os.path.join(outDir,indexFilename),'a') as indexFile:
					indexFile.write(inFilename + "\n")

# TODO: might not be necessary since we get the date when saving info from getFromLog()
# and we will use that for graphing data.  I guess if we need a quick check, this will work.
def getLogRange(filename = "out\\concatIndex.txt"):
	if os.path.isfile(filename):
		contents = []
		with open(filename, 'r') as indexFile:
			for content in indexFile.read().splitlines():
				contents.append(re.search("(\d{4}-\d{2}-\d{2})", content).group(1))
		contents = sorted(set(contents))
		startDate = parser.parse(contents[0])
		endDate = parser.parse(contents[-1])
		return [startDate,endDate]



def addEscapeForSearch(string, char):
	loc = string.find(char)
	if loc is not -1:
		string = string[:loc] + "\\" + string[loc:]
	return string

def getFromLog(functionCall, contents):
	reDateTime = "(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})"
	reString = functionCall
	reString = addEscapeForSearch(reString, "(")
	reString = addEscapeForSearch(reString, ")")
	reFunctionCall = re.finditer(reDateTime + ".*(" + reString + ")",contents)
	count = 0
	dfList = []
	for item in reFunctionCall:
		dfList.append([item.group(1),item.group(2),item.group(3)])
		# print(item.group(0))
		count += 1
	# print(functionCall + " " + str(count))
	# print(dfList)
	return dfList


# figure out how many times each function is called:
# [getColorInfoIntent, getResistorDecodeIntent, calculateResistanceIntent,
#  getResistorResponseIntent, getOrientationResponseIntent]
# return it with a timestamp.
def createFunctionCallsCSV(filename = "out\\concatLog.txt", outFile="out\\functionCalls.csv"):
	if os.path.isfile(filename):
		contents = []
		with open(filename, 'r') as logFile:
			contents = logFile.read()
		dfList = []
		logItems = ["START", "onSessionStarted():", "onLaunch():", "getColorInfoIntent():", "getResistorDecodeIntent():", "calculateResistanceIntent():", "buildCalculateResistanceIntent():", "getResistorResponseIntent():", "getOrientationResponseIntent():", "END"]
		for item in logItems:
			dfList.append(pandas.DataFrame.from_dict(getFromLog(item, contents)))
		concatDF=pandas.concat(dfList, ignore_index=True)
		concatDF.sort_values([0,1], inplace=True)
		concatDF.to_csv(outFile)
	else:
		print("The file concatLog.txt has not been created.")

# Figure out the order that functions are called from START to END.  Count the number of times each path is used.

# bar graph of number of times each function is called.  Graph of how many times each is called to completion?  (probably have to update logging again for this to work)
def graphFunctionCalls(inFile="out\\functionCalls.csv"):
    df = pandas.read_csv(inFile)
    df.plot()


# print(os.getcwd())
# extractFiles()
# concatenate()
# getFunctionCalls()
# print(getLogRange())
