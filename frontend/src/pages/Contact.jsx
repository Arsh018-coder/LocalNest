import React from "react";

function Contact() {
    return (
        <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>
        <form className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name
            </label>
            <input
                type="text"
                id="name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Your Name"
            />
            </div>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
            </label>
            <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Your Email"
            />
            </div>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
                Message
            </label>
            <textarea
                id="message"
                rows="4"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Your Message"
            ></textarea>
            </div>
            <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
            Send Message
            </button>
        </form>
        </div>
    );

}

export default Contact;