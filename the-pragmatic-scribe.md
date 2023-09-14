The Pragmatic Scribe
====================================

> *Say what you mean, simply and directly.*
>
> *- Brian W. Kernighan, The Elements of Programming Style*

Table of Contents
---------------------------

- [Introduction](#introduction)
- [A Note on Systems](#a-note-on-systems)
- [Philosophy](#philosophy)
	- [Motivation](#motivation)
	- [Audience](#audience)
	- [Style](#style)
	- [Placement](#placement)
	- [Maintenance](#maintenance)
	- [Paradigms](#paradigms)
- [The Pragmatic Scribe Paradigm](#the-pragmatic-scribe-paradigm)
	- [Discovery](#discovery)
	- [Detail](#detail)
	- [Accessibility and Abstraction](#accessibility-and-abstraction)
	- [Serial Documentation](#paradigm)
- [Formats](#formats)
	- [Semantic Code](#semantic-code)
	- [Comments](#comments)
	- [DocStrings](#docstrings)
	- [Markdown](#markdown)
	- [DBML](#dbml)
- [Classes](#classes)
	- [Project Docs](#project-docs)
		- [README](#readme)
		- [LICENSE](#license)
		- [CHANGELOG](#changelog)
		- [CONTRIBUTING](#contributing)
		- [CONTRIBUTORS](#contributors)
		- [AUTHORS](#authors)
		- [SUPPORT](#support)
		- [SECURITY](#security)
		- [CODE_OF_CONDUCT](#code-of-conduct)
		- [ACKNOWLEDGEMENTS](#acknowledgements)
		- [CODEOWNERS](#codeowners)
		- [FUNDING](#funding)
		- [ISSUE_TEMPLATE](#issue-template)
		- [PULL_REQUEST_TEMPLATE](#pull-request-template)
	- [Guide Docs](#guide-docs)
		- [Manuals](#manuals)
		- [Tutorials](#tutorials)
	- [API Docs](#api-docs)
	- [Design Docs](#design-docs)
		- [Architecture Diagrams](#architechture-diagrams)
		- [Design Patterns](#design-patterns)
		- [Database Schema](#database-schema)
	- [Test Docs](#test-docs)
		- [Test Plans](#test-plans)
		- [Test Cases](#test-cases)
	- [DevOps Docs](#devops-docs)
		- [C/MID](#c-mid)
		- [IaC](#iac)
		- [Deploy Docs](#deploy-docs)
	- [Network Docs](#network-docs)
		- [Servers](#servers)
		- [Load Balancing](#load-balancing)
		- [Security](#security)
	- [Portability Docs](#portability-docs)
	- [Observability Docs](#observability-docs)
		- [Monitoring](#monitoring)
		- [Logging](#logging)
		- [Alerts](#alerts)
	- [InfoSec Docs](#infosec-docs)
	- [Performance Docs](#performance-docs)
		- [Profiling](#profiling)
		- [Tuning](#tuning)
- [Conclusion](#conclusion)
- [See Also](#see-also)

Introduction
-------------------

In the ever-evolving landscape of software engineering, the role of documentation cannot be overstated. Documentation serves as the lifeblood of any software project, enabling developers to understand, maintain, and extend codebases effectively. In this comprehensive guide, we will explore the intricacies of creating high-quality documentation, catering to both novice and experienced software engineers.

A Note on Systems
---------------------------

Before delving into the specifics of documentation, it's crucial to understand the systems that documentation interacts with. Software development is not isolated; it's part of a larger ecosystem that includes various tools, technologies, and paradigms. We'll briefly touch upon these systems to provide context for the importance of documentation in this complex environment.

Philosophy
----------------

### Motivation

Why do we document? What drives us to spend time and effort on something that often seems secondary to writing code? We'll delve into the motivations behind documentation and how it ultimately benefits individual developers and the software development community.

### Audience

Understanding your audience is pivotal in crafting effective documentation. Whether you're writing for fellow developers, end-users, or project stakeholders, tailoring your documentation to meet their needs is essential. We'll explore strategies for identifying and catering to different audiences.

### Style

Just as software code follows coding conventions and style guides, documentation should adhere to its own set of stylistic guidelines. Consistency and readability are key factors in creating documentation that resonates with its readers.

### Placement

Where and when should documentation be introduced in the software development process? We'll discuss the optimal points in a project's lifecycle to create and update documentation to ensure it remains relevant and valuable.

### Maintenance

Documentation is not a one-time effort; it requires ongoing maintenance to stay up-to-date and accurate. We'll cover best practices for keeping your documentation in sync with your codebase, even as it evolves over time.

### Paradigms

Diving deeper into the philosophical aspects, we'll explore different paradigms of documentation. From traditional to modern approaches, each paradigm has its own set of advantages and drawbacks. Understanding these paradigms can help you choose the one that best suits your project's needs.

The Pragmatic Scribe Paradigm
----------------------------------------------

### Discovery

Documentation often involves uncovering the intricacies of a project. We'll discuss the process of discovery, where you explore and understand the codebase, and how this understanding informs your documentation efforts.

### Detail

The devil is in the details, and thorough documentation leaves no stone unturned. We'll delve into the art of documenting every aspect of your code, ensuring that no detail is too insignificant to be included.

### Accessibility and Abstraction

Balancing accessibility for newcomers while providing abstraction for experts is a delicate act. We'll explore strategies to make your documentation accessible to various skill levels without compromising on depth.

### Serial Documentation

Serial documentation represents a unique paradigm where documentation evolves alongside code changes. We'll explore the benefits of this approach and how it can streamline the documentation process.

Formats
-----------

Documentation comes in various forms, each with its unique strengths. We'll explore formats such as semantic code, comments, docstrings, markdown, and DBML, discussing when and how to use them effectively.

### Semantic Code

Writing self-explanatory code can be a form of documentation in itself. We'll look at the principles of writing semantic code that tells a story without additional documentation.

### Comments

Comments serve as annotations to your code, providing context and explanations. We'll discuss when and how to use comments effectively, avoiding common pitfalls.

### DocStrings

In languages like Python, docstrings play a crucial role in documenting functions and classes. We'll explore the conventions for writing clear and informative docstrings.

### Markdown

Markdown is a versatile format for creating structured documents. We'll delve into its syntax and explore how it can be used for various types of documentation.

### DBML

Database schema documentation is a critical part of many projects. We'll discuss how DBML, a specialized language, can be used to document your database schema effectively.

Classes
-----------

Documentation isn't a monolithic entity; it varies based on the context. We'll categorize documentation into different classes, each tailored to specific aspects of a project.

### Project Docs

Project-level documentation provides an overview and governance for the entire software project. We'll explore key documents like README, LICENSE, CHANGELOG, CONTRIBUTORS, and more.

#### README

The README is often the first thing users encounter. We'll discuss how to craft a compelling README that welcomes users and provides essential information about your project.

#### LICENSE

Licensing is a critical aspect of open-source projects. We'll delve into the various open-source licenses and help you choose the one that aligns with your project's goals.

#### CHANGELOG

Keeping track of changes is essential for transparency and collaboration. We'll explore the art of maintaining a changelog that communicates updates effectively.

#### CONTRIBUTING

Encouraging contributions is vital for open-source projects. We'll discuss CONTRIBUTING guidelines to help potential contributors understand how to get involved.

#### CONTRIBUTORS

Acknowledge the contributions of those who help your project thrive. We'll discuss how to maintain a CONTRIBUTORS file to give credit where it's due.

#### AUTHORS

Identifying and crediting authors is crucial for projects with multiple contributors. We'll explore how to maintain an AUTHORS file that recognizes individual contributions.

#### SUPPORT

Providing support information ensures users have a channel to seek assistance. We'll discuss strategies for offering support and guiding users to the right resources.

#### SECURITY

Security is paramount. We'll delve into how to document security-related information and procedures to keep your project safe.

#### CODE_OF_CONDUCT

Fostering a welcoming and inclusive community is essential. We'll explore the importance of a CODE_OF_CONDUCT document and how to enforce it.

### ACKNOWLEDGEMENTS

Show appreciation for libraries and tools your project relies on. We'll explore how to maintain an ACKNOWLEDGEMENTS document.

#### CODEOWNERS

Designate individuals responsible for specific parts of the codebase. We'll discuss how CODEOWNERS files can streamline code review and maintenance.

#### FUNDING

Support for your project can come from various sources. We'll explore options for documenting funding and sponsorship information.

#### ISSUE_TEMPLATE

Guiding users in creating meaningful issue reports is crucial for efficient issue tracking. We'll discuss how to set up ISSUE_TEMPLATE documents.

#### PULL_REQUEST_TEMPLATE

Facilitate the contribution process by defining clear guidelines for pull requests. We'll explore the benefits of using PULL_REQUEST_TEMPLATE documents.

### Guide Docs

Guide documentation helps users understand how to use your software effectively. We'll categorize guide docs into manuals and tutorials.

#### Manuals

Manuals provide comprehensive instructions for using your software. We'll discuss how to create manuals that guide users through various scenarios.

#### Tutorials

Tutorials offer step-by-step guidance for specific tasks. We'll explore the art of creating tutorials that empower users to achieve their goals.

### API Docs

For libraries and APIs, clear documentation is essential. We'll discuss strategies for documenting APIs to make integration seamless for developers.

### Design Docs

Design documentation delves into the architecture and inner workings of your software. We'll categorize design docs into architecture diagrams, design patterns, and database schema.

#### Architecture Diagrams

Visual representations of your software's architecture can aid in understanding complex systems. We'll explore how to create effective architecture diagrams.

#### Design Patterns

Documenting design patterns helps developers make informed decisions. We'll discuss how to describe and apply common design patterns in your projects.

#### Database Schema

For projects with databases, documenting the schema is crucial. We'll explore methods for documenting your database structure effectively.

### Test Docs

Testing is a critical aspect of software development. We'll categorize test documentation into test plans and test cases.

#### Test Plans

Test plans outline the high-level strategy for testing your software. We'll discuss how to create comprehensive test plans that ensure thorough coverage.

#### Test Cases

Test cases provide detailed instructions for individual tests. We'll explore the art of crafting test cases that are precise and easy to follow, making debugging and quality assurance more efficient.

### DevOps Docs

DevOps practices are integral to modern software development. We'll categorize DevOps documentation into Configuration Management and Infrastructure as Code (IaC) documentation, and Deployment documentation.

#### C/MID (Configuration Management and Infrastructure Documentation)

Documenting infrastructure and configuration management is crucial for maintaining consistency and reliability in your environments. We'll discuss how to document infrastructure components and configurations effectively.

#### IaC (Infrastructure as Code)

As DevOps teams embrace Infrastructure as Code, documenting IaC scripts and templates becomes essential. We'll explore methods for documenting your infrastructure code to ensure repeatability and reliability.

#### Deployment Docs

Deploying software is the culmination of the development process. We'll discuss how to document deployment procedures, ensuring that your software can be deployed consistently and securely.

### Network Docs

In an interconnected world, network documentation is vital. We'll categorize network documentation into Servers, Load Balancing, and Security.

#### Servers

Documenting server configurations and setups is crucial for maintaining a stable network environment. We'll explore how to create server documentation that aids in troubleshooting and maintenance.

#### Load Balancing

Load balancing ensures optimal resource utilization and fault tolerance. We'll discuss how to document load balancing configurations to keep your network running smoothly.

#### Security

Security documentation is paramount in safeguarding your network and data. We'll explore methods for documenting security measures, protocols, and best practices.

### Portability Docs

In an era of diverse platforms, portability documentation is essential. We'll discuss strategies for documenting how your software can be deployed and run on various platforms.

### Observability Docs

Observability is key to understanding how your software behaves in production. We'll categorize observability documentation into Monitoring, Logging, and Alerts.

#### Monitoring

Monitoring documentation helps you set up and maintain systems that track the performance and health of your software. We'll discuss how to document monitoring solutions effectively.

#### Logging

Logging is crucial for diagnosing issues and auditing software behavior. We'll explore how to document logging practices and configurations to aid in troubleshooting.

#### Alerts

Alerts are your early warning system for critical issues. We'll discuss how to document alerting mechanisms and thresholds to keep your team informed.

### InfoSec Docs

Information security documentation is critical in today's digital landscape. We'll explore strategies for documenting security policies, incident response plans, and compliance requirements.

### Performance Docs

Optimizing performance is a continuous endeavor. We'll categorize performance documentation into Profiling and Tuning.

#### Profiling

Profiling helps identify performance bottlenecks. We'll discuss how to document profiling procedures and results to guide performance improvements.

#### Tuning

Tuning involves optimizing software for better performance. We'll explore how to document tuning efforts and their impact on your software's efficiency.

Conclusion
----------------

In conclusion, documentation is not merely a chore but a fundamental aspect of software engineering. It serves as a bridge between developers, users, and the software itself. By understanding documentation philosophy, paradigms, and formats and categorizing it into different classes, you can create documentation that enhances your software's usability, maintainability, and overall quality. Whether you're a seasoned software engineer or just beginning your journey, mastering the art of documentation is a skill that will set you apart in the ever-evolving world of technology.

See Also
-------------

- [google/styleguide/docguide](https://github.com/google/styleguide/tree/gh-pages/docguide)
- [GitHub Repository Structure Best Practices](https://medium.com/code-factory-berlin/github-repository-structure-best-practices-248e6effc405)
- [DBML - Database Markup Language](https://dbml.dbdiagram.io/home/#dbml-database-markup-language)
- [Markdown Guide](https://www.markdownguide.org)