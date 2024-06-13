// Select the images
const gifImage1 = document.querySelector("#gif1");
const gifImage2 = document.querySelector("#gif2");

// Define the source paths for the GIFs and static images
const gifSrc1 = './GIFs/Blue_front.gif';
const staticSrc1 = './GIFs/Blue_front_static.png';
const gifSrc2 = './GIFs/Yellow_front.gif';
const staticSrc2 = './GIFs/Yellow_front_static.png';

// Set the initial src for the images
gifImage1.src = staticSrc1;
gifImage2.src = staticSrc2;

// Function to handle key press events
document.addEventListener('keydown', function(event) {
    if (event.key === '1') {
        // Play first GIF on key '1'
        gifImage1.src = gifSrc1;
        setTimeout(() => {
            gifImage1.src = staticSrc1;
        }, 267);
    } else if (event.key === '2') {
        // Play second GIF on key '2'
        gifImage2.src = gifSrc2;
        setTimeout(() => {
            gifImage2.src = staticSrc2;
        }, 267);
    }
});
