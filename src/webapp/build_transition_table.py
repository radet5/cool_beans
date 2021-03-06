import csv
import logging
from tabulate import tabulate
import sqlite3

def initializeTree(name, cust_id):
    return [{'state':0, 'input':name[0], 'next':1, 'prev':'', 'results':[]},
            {'state':1, 'input':'', 'next':'', 'prev':0, 'results':[(name, cust_id)]}]

def selectState(tree, state):
    """Returns a list of Dicts
        Returns all entries with state == state"""
    return [entry for entry in tree if entry['state'] == state]

def selectInput(tree, state, input_char):
    """Returns a list of dicts
        Returns all entries with state == state AND input == input_char"""
    sel = selectState(tree, state)
    return [entry for entry in sel if entry['input'] == input_char]

def addNewRow(tree, input_char, state, prev, results, nxt):
    new_row = {'input':input_char, 'state':state, 'prev':prev,\
               'results':results, 'next':nxt}
    logging.debug("\nCreating Row::\n"+tabulate([new_row], headers="keys",\
                                        tablefmt="grid")+"\n")
    tree.append(new_row)
    return new_row

def alterRow(row, input_c='', state='', prev='', results='', nxt=''):
    logging.debug("\nAltering Row from:\n")
    logging.debug(tabulate([row], headers="keys",\
                    tablefmt="grid"))
    if input_c:
        row['input'] = input_c
    if state:
        row['state'] = state
    if prev:
        row['prev'] = prev
    if not results == '':
        row['results'] = results
    if nxt:
        row['next'] = nxt
    logging.debug("to:")
    logging.debug(tabulate([row], headers="keys",\
                    tablefmt="grid")+"\n")
    return row

#TODO: MAYBE. MIGHT NOT BE REUSABLE: rework addName into a searchTree function
#       which returns info nessecary to add name in right place
#TODO: FIX CURRENTLY ONLY WORKS IF IN ALPHABETICAL ORDER
def addName(tree, name, cust_id):
    """Returns NULL
        Adds name to tree"""
    logging.debug("\nEnroling: "+name+"\n")
    state = 0
    for depth, input_char in enumerate(name):
        logging.debug("\nDepth: "+str(depth)+", State: "+str(state)+\
              ", Input: "+input_char)

        nxt = selectInput(tree, state, input_char)
        #Check if there is a transition entry from current state using current
        # input. If so: follow the transition to next state
        if nxt:
            state = nxt[0]['next']
            logging.debug("Transition exists for: "+input_char+"\n")
            #In case you add a short name which is a subset of an already
            # enrolled name
            if len(name) == depth+1:
                logging.debug("WELL WELL WELL")
                depth += 1
                cur_state = selectState(tree, state)
                new_state_id = sorted(tree, key=lambda s: s['state'],\
                                      reverse=True)[0]['state']+1
                for row in cur_state:
                    if len(row['results']) > 0:
                        if row['results'][0][0] == name:
                            row['results'].append((name, cust_id))
                        else:
                            addNewRow(tree, row['input'], new_state_id, state,\
                                      row['results'][:], row['next'])
                            alterRow(row, row['results'][0][0][depth], '', '',\
                            [(name, cust_id)], new_state_id)
                            new_state_id += 1
                    else:
                        row['results'].append((name, cust_id))

                return
        #Otherwise gonna have to create transition
        else:
            cur_state = selectState(tree, state)
            new_state_id = sorted(tree, key=lambda s: s['state'],\
                                  reverse=True)[0]['state']+1
            #If only one entry for current state:
            if len(cur_state) == 1:
                logging.debug("LEAF NODE: POSSIBLE COLLISION")
                #Weird work around for dealing with state 0
                if not cur_state[0]['results']:
                    logging.debug("WEIRD\nCreating Rows:")
                    addNewRow(tree, input_char, state,'',[],new_state_id)
                    addNewRow(tree, '', new_state_id, state, [(name, cust_id)], '')
                    return
                #Same last name, so multiple results in one leaf.
                # TODO: SHOULD eventually RECORD THE CUSTOMER ID's HERE
                elif cur_state[0]['results'][0][0] == name:
                    logging.debug("COllISION!")
                    cur_state[0]['results'].append((name, cust_id))
                    return

                #If there's not a transition for current input AND there is no
                # collision then current leaf needs to be moved down to next
                # depth level and a transition entered. Also need to insert
                # current entry and record the transition entry for it
                else:
                    logging.debug("Need to branch!\nCreating Rows:\n")
                    #Make sure name at current level has more letters in it
                    # if it does, move it down
                    if len(cur_state[0]['results'][0][0]) > depth :
                        new_row = addNewRow(tree, '', new_state_id, state,\
                                            cur_state[0]['results'][:],\
                                            '')
                        alterRow(cur_state[0],\
                                 cur_state[0]['results'][0][0][depth],\
                                 '', '', [], new_state_id)
                        new_state_id += 1
                        #Case for when prev name is subset of current name
                        # Just move on to next state/letter/depth
                        if new_row['results'][0][0][depth] == input_char:
                                logging.debug("SAME LETTER!")
                                state = cur_state[0]['next']
                                #unless the current name is out of letters
                                if len(name) == depth+1:
                                    logging.debug("WELL WELL WELL")
                                    depth += 1
                                    cur_state = selectState(tree, state)
                                    new_state_id = sorted(tree, key=lambda s: s['state'],\
                                                        reverse=True)[0]['state']+1
                                    for row in cur_state:
                                        if len(row['results']) > 0:
                                            if row['results'][0][0] == name:
                                                row['results'].append((name, cust_id))
                                            else:
                                                addNewRow(tree, row['input'],\
                                                          new_state_id,\
                                                          state,\
                                                          row['results'][:],\
                                                          row['next'])
                                                alterRow(row,\
                                                         row['results'][0][0][depth],\
                                                         '', '',\
                                                         [(name, cust_id)], new_state_id)
                                                new_state_id += 1
                                        else:
                                            row['results'].append((name, cust_id))

                                    return
                        else:
                            addNewRow(tree, input_char, state,\
                                      cur_state[0]['prev'], [],\
                                      new_state_id)
                            addNewRow(tree, '', new_state_id,\
                                      state, [(name, cust_id)], '')
                            return 
                    #If name at cur level DOESN'T have any more letters,
                    # it stays in place
                    else:
                        addNewRow(tree, '', new_state_id, state, [(name, cust_id)], '')
                        #Check if there is already a transtion be sure to preserve it
                        if cur_state[0]['input']:
                            logging.debug("Well shit, Sir Ashon")
                            addNewRow(tree, input_char, cur_state[0]['state'],\
                                      cur_state[0]['prev'], [], new_state_id)
                        else:
                            alterRow(cur_state[0], input_c=input_char,\
                                     nxt=new_state_id)
                        return
            #If there are multiple transitions from current state, but none are
            # for the current input then we need to add a transition for
            # current input and then insert name
            elif len(cur_state) > 1:
                logging.debug("NOT IN TREE\n")
                addNewRow(tree, input_char, state, cur_state[0]['prev'], [],\
                             new_state_id)
                addNewRow(tree, '', new_state_id, state, [(name, cust_id)], '')
                return

def insertCustRowIntoDb(row, cursor):
    cursor.execute('INSERT INTO cust (cust_last_name, cust_first_name) VALUES (?,?)',\
              (row['last_name'].lower(), row['first_name'].lower()))
    return cursor.lastrowid
    
def insertTransitionTableRowIntoDb(row, cursor):
    cursor.execute('INSERT INTO transition (transition_input, transition_state,\
               transition_prev, transition_next) VALUES (?,?,?,?)',\
              (row['input'], row['state'], row['prev'], row['next']))
    transition_row_id = cursor.lastrowid
    for result in row['results']:
        cursor.execute('INSERT INTO result (result_transition_id, result_cust_id)\
                   VALUES (?,?)', (transition_row_id, result[1]))

def graph(tree):
    """Returns a string which can be used by dot to create a directed graph of
        the transition table"""
    f = "digraph {\n"
    for row in tree:
        A = row['state']
        B = row['next']
        label = row['input']
        if B:
            f += "\t"+str(A)+" -> "+str(B)+" [label = \""+label+"\"]\n"
            if len(row['results']) > 0:
                f += "\t"+str(A)+" -> "+row['results'][0][0]+"\n"
        else:
            f += "\t"+str(A)+" -> "+row['results'][0][0]+"\n"
    f += "}"
    return f

