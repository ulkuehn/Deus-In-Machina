/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Spellchecker class
 */

class Spellchecker {
  #spell = null; // hunspell spellchecker object
  #userWords; // list of words defined by user as correct
  #dirty; // true if object changed

  /**
   * class constructor
   *
   * @param {String} language necessary
   * @param {String[]} userWords
   */
  constructor(language, userWords = []) {
    this.#userWords = userWords;
    this.#dirty = true;

    new Promise((resolve, reject) => {
       let path = nodePath.join(__dirname, "..", "dictionaries",language);
      try {
        fs.access(nodePath.join(path,"index.aff"), fs.R_OK, (err) => {
          if (!err) {
            fs.access(nodePath.join(path,"index.dic"), fs.R_OK, (err) => {
              if (!err) {
                fs.readFile(nodePath.join(path,"index.dic"), (err, dic) => {
                  if (!err) {
                    fs.readFile(nodePath.join(path,"index.aff"), (err, aff) => {
                      if (!err) {
                        this.#spell = new Nodehun(aff, dic);
                        resolve("ready");
                      }
                    });
                  }
                });
              }
            });
          }
        });
      } catch (err) {
        console.error(
          `no spellchecker for language "${language}" -- error is: ${err}`,
        );
        reject();
      }
    }).then(() => {
      this.#userWords.forEach((word) => {
        this.#spell.add(word).then(() => {});
      });
    });
  }

  // getters and setters

  get userWords() {
    return this.#userWords;
  }
  set userWords(words) {
    this.#userWords = words;
  }

  get spell() {
    return this.#spell;
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  isLoaded() {
    return this.#spell != null;
  }

  /**
   * check a word with the spellchecker
   *
   * @param {String} word
   * @returns {Boolean} true if word is correct
   */
  isCorrect(word) {
    if (!this.#spell) {
      return true;
    }
    return this.#spell.spellSync(word);
  }

  /**
   * get word suggestions from the spellchecker
   *
   * @param {String} word
   * @returns {String[]|null} suggestions
   */
  suggest(word) {
    if (!this.#spell) {
      return null;
    }
    return this.#spell.suggestSync(word);
  }

  /**
   * add a word to the word list
   *
   * @param {String} word
   */
  addCorrect(word) {
    if (!this.#userWords.includes(word)) {
      this.#userWords.push(word);
      this.#spell.add(word).then(() => {});
    }
  }

  /**
   * remove a word from the word list
   *
   * @param {String} word
   */
  removeCorrect(word) {
    if (this.#userWords.includes(word)) {
      this.#userWords.splice(this.#userWords.indexOf(word), 1);
      this.#spell.remove(word).then(() => {});
    }
  }

  /**
   * change the list of words so it contains only the given words
   *
   * @param {String[]} words
   */
  updateWords(words) {
    // remove deleted words
    this.#userWords.forEach((word) => {
      if (!words.includes(word)) {
        this.#userWords.splice(this.#userWords.indexOf(word), 1);
        this.#spell.remove(word).then(() => {});
      }
    });
    // add new words
    words.forEach((word) => {
      if (!this.#userWords.includes(word)) {
        this.#userWords.push(word);
        this.#spell.add(word).then(() => {});
      }
    });
  }
}
