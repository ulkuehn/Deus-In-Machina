/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of splash window
 */

/**
 * initialize window
 *
 * @param {Boolean} doSounds if true play sound
 * @param {String} name program name
 * @param {String} version program version
 */
ipcRenderer.on("splashWindow_init", (event, [doSounds, name, version]) => {
  let $parent = $("<div>").attr({
    style: "height:450px; width:500px; position:relative;",
  });
  let $child = $("<div>")
    .attr({
      style:
        "position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);",
    })
    .append(
      `<span class="fa-stack fa-5x">
          <i
            class="fa-solid fa-cog fa-stack-1x fa-lg fa-pulse"
            style="--fa-animation-duration:6s; color: #f7b801;"
          ></i>
          <i
            class="fa-solid fa-infinity fa-stack-2x fa-spin"
            style="--fa-animation-duration:12s; color: #7678ed;"
          ></i>
        </span>`,
    )
    .append(
      $("<p>")
        .attr({
          style: "margin-top:50px; font-size:30px;",
        })
        .html(name),
      $("<p>")
        .attr({
          style: "font-size:15px;",
        })
        .html(version),
    );

  $("body")
    .attr({
      style:
        "background-color:black; overflow:hidden; color:white; font-family:'ui'; animation-duration:15s; animation-name:blur; filter:blur(100px);",
    })
    .append($parent)
    .append($child);

  if (doSounds && Sounds.splashSounds.length) {
    let promises = [];
    Sounds.splashSounds.forEach((sound) => {
      let audio = new Audio(Sounds.splashPath + sound.name);
      promises.push(
        new Promise((resolve) => {
          audio.addEventListener("ended", (event) => {
            resolve();
          });
        }),
      );
      audio.play();
    });

    Promise.allSettled(promises).then(() => {
      ipcRenderer.invoke("mainProcess_closeSplashWindow");
    });
  } else {
    setTimeout(() => ipcRenderer.invoke("mainProcess_closeSplashWindow"), 3000);
  }
});
